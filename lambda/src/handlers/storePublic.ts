import { QueryCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type {
  LibraryPhoto, Photographer, PhotoCollection, PublicCollection, PublicCollectionPage, PublicPhoto,
} from '../../../shared/types/store';
import { ok, errResponse } from '../lib/photoShared';
import { ddb, PHOTO_COLLECTIONS_TABLE, PHOTO_LIBRARY_TABLE, STORE_PHOTOGRAPHERS_TABLE } from '../lib/storeShared';

const PAGE_SIZE = 60;
const QUERY_BATCH = 100;

// Shop visibility: for sale, not taken down, in a published collection (data-model.md).
function isForSale(p: Pick<LibraryPhoto, 'forSale' | 'removed'>): boolean {
  return p.forSale && !p.removed;
}

async function photographerNames(): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  let startKey: Record<string, unknown> | undefined;
  do {
    const r = await ddb.send(new ScanCommand({
      TableName: STORE_PHOTOGRAPHERS_TABLE,
      ProjectionExpression: 'id, #n',
      ExpressionAttributeNames: { '#n': 'name' },
      ExclusiveStartKey: startKey,
    }));
    for (const p of (r.Items ?? []) as Pick<Photographer, 'id' | 'name'>[]) names.set(p.id, p.name);
    startKey = r.LastEvaluatedKey;
  } while (startKey);
  return names;
}

async function forSaleSummary(collectionId: string): Promise<Pick<LibraryPhoto, 'id' | 'sortOrder' | 'thumbnailUrl' | 'photographerId'>[]> {
  const items: Pick<LibraryPhoto, 'id' | 'sortOrder' | 'thumbnailUrl' | 'photographerId'>[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const r = await ddb.send(new QueryCommand({
      TableName: PHOTO_LIBRARY_TABLE,
      IndexName: 'byCollection',
      KeyConditionExpression: 'collectionId = :c',
      FilterExpression: 'forSale = :t AND removed = :f',
      ProjectionExpression: 'id, sortOrder, thumbnailUrl, photographerId',
      ExpressionAttributeValues: { ':c': collectionId, ':t': true, ':f': false },
      ExclusiveStartKey: startKey,
    }));
    items.push(...((r.Items ?? []) as typeof items));
    startKey = r.LastEvaluatedKey;
  } while (startKey);
  return items;
}

// GET /api/store/collections — published collections with at least one photo for sale, newest event first.
export async function listPublicCollections(): Promise<APIGatewayProxyResultV2> {
  const collections: PhotoCollection[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const r = await ddb.send(new QueryCommand({
      TableName: PHOTO_COLLECTIONS_TABLE,
      IndexName: 'byEventDate',
      KeyConditionExpression: 'entity = :e',
      ExpressionAttributeValues: { ':e': 'COLLECTION' },
      ScanIndexForward: false,
      ExclusiveStartKey: startKey,
    }));
    collections.push(...((r.Items ?? []) as PhotoCollection[]));
    startKey = r.LastEvaluatedKey;
  } while (startKey);

  const published = collections.filter((c) => c.status === 'published');
  const [names, summaries] = await Promise.all([
    photographerNames(),
    Promise.all(published.map((c) => forSaleSummary(c.id))),
  ]);

  const result: PublicCollection[] = [];
  published.forEach((c, i) => {
    const photos = summaries[i].sort((a, b) => a.sortOrder - b.sortOrder);
    if (photos.length === 0) return;
    const cover = photos.find((p) => p.id === c.coverPhotoId) ?? photos[0];
    const credits = [...new Set(photos.map((p) => (p.photographerId ? names.get(p.photographerId) : undefined)).filter((n): n is string => !!n))];
    result.push({
      id: c.id,
      eventId: c.eventId,
      title: c.title,
      eventDate: c.eventDate,
      coverThumbnailUrl: cover.thumbnailUrl,
      photoCount: photos.length,
      photographerNames: credits,
    });
  });
  return ok({ collections: result });
}

function encodeCursor(key: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(key)).toString('base64url');
}

function decodeCursor(cursor: string): Record<string, unknown> | null {
  try {
    const key = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown;
    return key && typeof key === 'object' && !Array.isArray(key) ? key as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

// GET /api/store/collections/{id}?cursor= — one page of a published collection's for-sale photos.
export async function getPublicCollectionPage(event: APIGatewayProxyEventV2, id: string): Promise<APIGatewayProxyResultV2> {
  const r = await ddb.send(new GetCommand({ TableName: PHOTO_COLLECTIONS_TABLE, Key: { id } }));
  const collection = r.Item as PhotoCollection | undefined;
  if (!collection || collection.entity !== 'COLLECTION' || collection.status !== 'published') {
    return errResponse(404, "This photo collection isn't available.");
  }

  const cursor = event.queryStringParameters?.cursor;
  let startKey: Record<string, unknown> | undefined;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded || decoded.collectionId !== id) return errResponse(400, 'Invalid page cursor');
    startKey = decoded;
  }

  // The for-sale filter runs after DynamoDB's Limit, so keep reading until the page is full.
  // If a page fills mid-batch, the cursor points at the last photo returned, not the batch end.
  const page: LibraryPhoto[] = [];
  let nextKey: Record<string, unknown> | undefined;
  do {
    const q = await ddb.send(new QueryCommand({
      TableName: PHOTO_LIBRARY_TABLE,
      IndexName: 'byCollection',
      KeyConditionExpression: 'collectionId = :c',
      FilterExpression: 'forSale = :t AND removed = :f',
      ExpressionAttributeValues: { ':c': id, ':t': true, ':f': false },
      Limit: QUERY_BATCH,
      ExclusiveStartKey: startKey,
    }));
    const items = (q.Items ?? []) as LibraryPhoto[];
    for (const item of items) {
      if (page.length === PAGE_SIZE) break;
      page.push(item);
    }
    const filledMidBatch = page.length === PAGE_SIZE && page[page.length - 1] !== items[items.length - 1];
    if (page.length === PAGE_SIZE) {
      const last = page[page.length - 1];
      nextKey = filledMidBatch || q.LastEvaluatedKey ? { id: last.id, collectionId: last.collectionId, sortOrder: last.sortOrder } : undefined;
      break;
    }
    startKey = q.LastEvaluatedKey;
    nextKey = undefined;
  } while (startKey);

  const names = await photographerNames();
  const photos: PublicPhoto[] = page.filter(isForSale).map((p) => ({
    id: p.id,
    thumbnailUrl: p.thumbnailUrl,
    previewUrl: p.previewUrl,
    width: p.width,
    height: p.height,
    priceCents: p.priceOverrideCents ?? collection.defaultPriceCents,
    photographerName: (p.photographerId && names.get(p.photographerId)) || '',
  }));

  const body: PublicCollectionPage = {
    collection: { id: collection.id, title: collection.title, eventDate: collection.eventDate, photoCount: collection.forSaleCount },
    photos,
    nextCursor: nextKey ? encodeCursor(nextKey) : null,
  };
  return ok(body);
}
