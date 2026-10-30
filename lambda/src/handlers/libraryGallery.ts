import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type { LibraryPhoto, PhotoCollection } from '../../../shared/types/store';
import { ok } from '../lib/photoShared';
import { ddb, PHOTO_COLLECTIONS_TABLE, PHOTO_LIBRARY_TABLE } from '../lib/storeShared';

// Same shape as the legacy GET /api/gallery response, so the Gallery and Events pages
// keep working unchanged. `url` is the clean web version, never the original.
export interface PublicGalleryPhoto {
  id: string;
  entity: 'PHOTO';
  url: string;
  thumbnailUrl: string;
  eventId: string | null;
  sortOrder: number;
  visible: true;
  createdAt: string;
}

async function queryAll<T>(input: ConstructorParameters<typeof QueryCommand>[0]): Promise<T[]> {
  const items: T[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const r = await ddb.send(new QueryCommand({ ...input, ExclusiveStartKey: startKey }));
    items.push(...((r.Items ?? []) as T[]));
    startKey = r.LastEvaluatedKey;
  } while (startKey);
  return items;
}

function toPublic(photo: LibraryPhoto, eventId: string | null): PublicGalleryPhoto {
  return {
    id: photo.id,
    entity: 'PHOTO',
    url: photo.webUrl,
    thumbnailUrl: photo.webThumbUrl,
    eventId,
    sortOrder: photo.gallerySortOrder,
    visible: true,
    createdAt: photo.createdAt,
  };
}

// GET /api/gallery[?eventId=<id>] — photos switched into the Gallery, in gallery order.
export async function getPublicGallery(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const eventId = event.queryStringParameters?.eventId;

  // Collections are few (one per event), so one query maps collection → event for every photo.
  const collections = await queryAll<PhotoCollection>({
    TableName: PHOTO_COLLECTIONS_TABLE,
    IndexName: 'byEventDate',
    KeyConditionExpression: 'entity = :e',
    ExpressionAttributeValues: { ':e': 'COLLECTION' },
  });
  const eventByCollection = new Map(collections.map((c) => [c.id, c.eventId]));

  if (eventId) {
    const collection = collections.find((c) => c.eventId === eventId);
    if (!collection) return ok({ photos: [] });
    const photos = await queryAll<LibraryPhoto>({
      TableName: PHOTO_LIBRARY_TABLE,
      IndexName: 'byCollection',
      KeyConditionExpression: 'collectionId = :c',
      FilterExpression: 'inGallery = :t AND removed = :f',
      ExpressionAttributeValues: { ':c': collection.id, ':t': true, ':f': false },
    });
    photos.sort((a, b) => a.gallerySortOrder - b.gallerySortOrder);
    return ok({ photos: photos.map((p) => toPublic(p, eventId)) });
  }

  // The sparse byGallery index only contains photos with inGallery && !removed.
  const photos = await queryAll<LibraryPhoto>({
    TableName: PHOTO_LIBRARY_TABLE,
    IndexName: 'byGallery',
    KeyConditionExpression: 'galleryKey = :g',
    ExpressionAttributeValues: { ':g': 'GALLERY' },
  });
  return ok({ photos: photos.map((p) => toPublic(p, eventByCollection.get(p.collectionId) ?? null)) });
}
