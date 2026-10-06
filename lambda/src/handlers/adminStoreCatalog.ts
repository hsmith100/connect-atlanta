import {
  QueryCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type {
  StoreCollection, StorePhoto, StorePhotoStatus, CollectionCreatePayload, CollectionUpdatePayload,
  StorePresignRequest, StorePresignResponse, StorePhotoCreatePayload, StorePhotoUpdatePayload,
  StorePhotoReplaceRequest, StorePhotoReplaceComplete,
} from '../../../shared/types/store';
import { ok, errResponse, requireAdmin } from '../lib/photoShared';
import {
  ddb, s3, STORE_COLLECTIONS_TABLE, STORE_PHOTOS_TABLE, EVENTS_TABLE, MEDIA_BUCKET, ORIGINALS_BUCKET,
  CLOUDFRONT_DOMAIN, newId, nowIso, readBody, json, created, mediaUrl, isValidPriceCents,
} from '../lib/storeShared';
import { getPhotographer } from './adminStorePhotographers';

const UPLOAD_URL_TTL_SECONDS = 900;
const MAX_PRESIGN_BATCH = 50;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CONTENT_TYPE_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png' };
const PHOTO_STATUSES: StorePhotoStatus[] = ['forSale', 'hidden', 'removed'];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getCollection(id: string): Promise<StoreCollection | null> {
  const r = await ddb.send(new GetCommand({ TableName: STORE_COLLECTIONS_TABLE, Key: { id } }));
  return (r.Item as StoreCollection | undefined) ?? null;
}

async function getPhoto(id: string): Promise<StorePhoto | null> {
  const r = await ddb.send(new GetCommand({ TableName: STORE_PHOTOS_TABLE, Key: { id } }));
  return (r.Item as StorePhoto | undefined) ?? null;
}

async function queryAllCollections(): Promise<StoreCollection[]> {
  const items: StoreCollection[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const r = await ddb.send(new QueryCommand({
      TableName: STORE_COLLECTIONS_TABLE,
      IndexName: 'byEventDate',
      KeyConditionExpression: 'entity = :e',
      ExpressionAttributeValues: { ':e': 'COLLECTION' },
      ScanIndexForward: false,
      ExclusiveStartKey: startKey,
    }));
    items.push(...((r.Items ?? []) as StoreCollection[]));
    startKey = r.LastEvaluatedKey;
  } while (startKey);
  return items;
}

export async function queryCollectionPhotos(collectionId: string): Promise<StorePhoto[]> {
  const items: StorePhoto[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const r = await ddb.send(new QueryCommand({
      TableName: STORE_PHOTOS_TABLE,
      IndexName: 'byCollection',
      KeyConditionExpression: 'collectionId = :c',
      ExpressionAttributeValues: { ':c': collectionId },
      ExclusiveStartKey: startKey,
    }));
    items.push(...((r.Items ?? []) as StorePhoto[]));
    startKey = r.LastEvaluatedKey;
  } while (startKey);
  return items;
}

async function adjustPhotoCount(collectionId: string, delta: number): Promise<void> {
  if (delta === 0) return;
  await ddb.send(new UpdateCommand({
    TableName: STORE_COLLECTIONS_TABLE,
    Key: { id: collectionId },
    UpdateExpression: 'ADD photoCount :d SET updatedAt = :now',
    ExpressionAttributeValues: { ':d': delta, ':now': nowIso() },
  }));
}

function mediaKeyFromUrl(url: string): string | null {
  const prefix = `https://${CLOUDFRONT_DOMAIN}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

function isStoreMediaUrl(url: unknown, folder: 'previews' | 'thumbs', id: string): url is string {
  if (typeof url !== 'string') return false;
  const key = mediaKeyFromUrl(url);
  return key !== null && new RegExp(`^store/${folder}/${id}-\\d+\\.jpg$`).test(key);
}

function isOriginalKeyFor(key: unknown, id: string): key is string {
  return typeof key === 'string' && new RegExp(`^originals/${id}\\.(jpg|png)$`).test(key);
}

async function presignFor(id: string, contentType: string): Promise<StorePresignResponse> {
  const ext = CONTENT_TYPE_EXT[contentType];
  const ts = Date.now();
  const originalKey = `originals/${id}.${ext}`;
  const previewKey = `store/previews/${id}-${ts}.jpg`;
  const thumbKey = `store/thumbs/${id}-${ts}.jpg`;
  const sign = (Bucket: string, Key: string, ContentType: string) =>
    getSignedUrl(s3, new PutObjectCommand({ Bucket, Key, ContentType }), { expiresIn: UPLOAD_URL_TTL_SECONDS });

  const [originalUploadUrl, previewUploadUrl, thumbUploadUrl] = await Promise.all([
    sign(ORIGINALS_BUCKET, originalKey, contentType),
    sign(MEDIA_BUCKET, previewKey, 'image/jpeg'),
    sign(MEDIA_BUCKET, thumbKey, 'image/jpeg'),
  ]);
  return {
    id, originalUploadUrl, previewUploadUrl, thumbUploadUrl, originalKey,
    previewUrl: mediaUrl(previewKey),
    thumbnailUrl: mediaUrl(thumbKey),
  };
}

async function objectExists(Bucket: string, Key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket, Key }));
    return true;
  } catch {
    return false;
  }
}

async function deleteMediaUrl(url: string): Promise<void> {
  const key = mediaKeyFromUrl(url);
  if (key) await s3.send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: key }));
}

// Publish preconditions (data-model.md). Photographer payment readiness is added by US5.
async function publishProblems(collection: StoreCollection): Promise<string[]> {
  const problems: string[] = [];
  if (!isValidPriceCents(collection.defaultPriceCents)) problems.push('Set a default price of at least $0.50');
  const forSale = (await queryCollectionPhotos(collection.id)).filter((p) => p.status === 'forSale');
  if (forSale.length === 0) problems.push('Add at least one photo for sale');
  const missing = forSale.filter((p) => !p.photographerId).length;
  if (missing > 0) problems.push(`${missing} photo(s) have no photographer assigned`);
  return problems;
}

// ── Collections ──────────────────────────────────────────────────────────────

export async function listCollections(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;
  return ok({ collections: await queryAllCollections() });
}

export async function createCollection(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body = readBody<CollectionCreatePayload>(event);
  if (!body || typeof body.eventId !== 'string' || !body.eventId) return errResponse(400, 'eventId is required');
  if (!isValidPriceCents(body.defaultPriceCents)) return errResponse(400, 'Default price must be at least $0.50');

  const eventRecord = await ddb.send(new GetCommand({ TableName: EVENTS_TABLE, Key: { id: body.eventId } }));
  if (!eventRecord.Item) return errResponse(404, 'Event not found');

  if (body.defaultPhotographerId) {
    const photographer = await getPhotographer(body.defaultPhotographerId);
    if (!photographer || !photographer.active) return errResponse(400, 'Default photographer not found or inactive');
  }

  const existing = await queryAllCollections();
  if (existing.some((c) => c.eventId === body.eventId)) return errResponse(409, 'This event already has a photo collection');

  const now = nowIso();
  const collection: StoreCollection = {
    id: newId(),
    entity: 'COLLECTION',
    eventId: body.eventId,
    title: String(eventRecord.Item.title ?? 'Event photos'),
    eventDate: String(eventRecord.Item.date ?? now.slice(0, 10)),
    status: 'draft',
    defaultPriceCents: body.defaultPriceCents,
    defaultPhotographerId: body.defaultPhotographerId ?? null,
    coverPhotoId: null,
    photoCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: STORE_COLLECTIONS_TABLE, Item: collection }));
  return created(collection);
}

export async function updateCollection(event: APIGatewayProxyEventV2, id: string): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body = readBody<CollectionUpdatePayload>(event);
  if (!body) return errResponse(400, 'Invalid request body');
  const collection = await getCollection(id);
  if (!collection) return errResponse(404, 'Collection not found');

  const next: StoreCollection = { ...collection };
  if (body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return errResponse(400, 'Title is required');
    next.title = title;
  }
  if (body.defaultPriceCents !== undefined) {
    if (!isValidPriceCents(body.defaultPriceCents)) return errResponse(400, 'Default price must be at least $0.50');
    next.defaultPriceCents = body.defaultPriceCents;
  }
  if (body.defaultPhotographerId !== undefined) {
    if (body.defaultPhotographerId !== null) {
      const photographer = await getPhotographer(body.defaultPhotographerId);
      if (!photographer || !photographer.active) return errResponse(400, 'Default photographer not found or inactive');
    }
    next.defaultPhotographerId = body.defaultPhotographerId;
  }
  if (body.coverPhotoId !== undefined) {
    if (body.coverPhotoId !== null) {
      const photo = await getPhoto(body.coverPhotoId);
      if (!photo || photo.collectionId !== id) return errResponse(400, 'Cover photo must belong to this collection');
    }
    next.coverPhotoId = body.coverPhotoId;
  }
  if (body.status !== undefined) {
    if (body.status !== 'draft' && body.status !== 'published') return errResponse(400, 'Status must be draft or published');
    if (body.status === 'published') {
      const problems = await publishProblems(next);
      if (problems.length) return json(422, { error: 'This collection is not ready to publish', problems });
    }
    next.status = body.status;
  }

  next.updatedAt = nowIso();
  await ddb.send(new PutCommand({ TableName: STORE_COLLECTIONS_TABLE, Item: next }));
  return ok(next);
}

export async function deleteCollection(event: APIGatewayProxyEventV2, id: string): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const collection = await getCollection(id);
  if (!collection) return errResponse(404, 'Collection not found');
  const photos = await queryCollectionPhotos(id);
  if (photos.length > 0) return errResponse(409, 'Delete or remove all photos in this collection first');

  await ddb.send(new DeleteCommand({ TableName: STORE_COLLECTIONS_TABLE, Key: { id } }));
  return ok({ deleted: true });
}

// ── Photos ───────────────────────────────────────────────────────────────────

export async function listCollectionPhotos(event: APIGatewayProxyEventV2, collectionId: string): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;
  const photos = (await queryCollectionPhotos(collectionId)).sort((a, b) => a.sortOrder - b.sortOrder);
  return ok({ photos });
}

export async function presignStorePhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const requests = readBody<StorePresignRequest[]>(event);
  if (!Array.isArray(requests) || requests.length === 0) return errResponse(400, 'Send between 1 and 50 files');
  if (requests.length > MAX_PRESIGN_BATCH) return errResponse(400, `Send at most ${MAX_PRESIGN_BATCH} files per request`);
  for (const req of requests) {
    if (typeof req.id !== 'string' || !UUID_RE.test(req.id)) return errResponse(400, 'Each file needs a valid id');
    if (!CONTENT_TYPE_EXT[req.contentType]) return errResponse(400, `${req.filename ?? 'File'} must be a JPEG or PNG`);
  }

  return ok(await Promise.all(requests.map((req) => presignFor(req.id, req.contentType))));
}

export async function createStorePhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const payloads = readBody<StorePhotoCreatePayload[]>(event);
  if (!Array.isArray(payloads) || payloads.length === 0) return errResponse(400, 'No photos to create');

  const collectionIds = new Set(payloads.map((p) => p.collectionId));
  if (collectionIds.size !== 1) return errResponse(400, 'All photos must belong to one collection');
  const collection = await getCollection(payloads[0].collectionId);
  if (!collection) return errResponse(404, 'Collection not found');

  const photographerOk = new Map<string, boolean>();
  for (const p of payloads) {
    if (!UUID_RE.test(p.id)) return errResponse(400, 'Invalid photo id');
    if (!isOriginalKeyFor(p.originalKey, p.id)) return errResponse(400, 'Invalid original key');
    if (!isStoreMediaUrl(p.previewUrl, 'previews', p.id) || !isStoreMediaUrl(p.thumbnailUrl, 'thumbs', p.id)) {
      return errResponse(400, 'Invalid preview or thumbnail URL');
    }
    if (!photographerOk.has(p.photographerId)) {
      const photographer = await getPhotographer(p.photographerId);
      photographerOk.set(p.photographerId, !!photographer && photographer.active);
    }
    if (!photographerOk.get(p.photographerId)) return errResponse(400, 'Photographer not found or inactive');
    if (!(await objectExists(ORIGINALS_BUCKET, p.originalKey))) {
      return errResponse(400, `The original for ${p.originalFilename} was not uploaded`);
    }
  }

  const now = nowIso();
  for (const p of payloads) {
    const photo: StorePhoto = {
      id: p.id,
      collectionId: p.collectionId,
      sortOrder: p.sortOrder,
      originalKey: p.originalKey,
      originalFilename: p.originalFilename,
      originalBytes: p.originalBytes,
      width: p.width,
      height: p.height,
      contentHash: p.contentHash,
      previewUrl: p.previewUrl,
      thumbnailUrl: p.thumbnailUrl,
      photographerId: p.photographerId,
      priceOverrideCents: null,
      status: 'forSale',
      createdAt: now,
      updatedAt: now,
    };
    await ddb.send(new PutCommand({
      TableName: STORE_PHOTOS_TABLE,
      Item: photo,
      ConditionExpression: 'attribute_not_exists(id)',
    }));
  }
  await adjustPhotoCount(collection.id, payloads.length);
  return created({ created: payloads.length });
}

export async function updateStorePhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const updates = readBody<StorePhotoUpdatePayload[]>(event);
  if (!Array.isArray(updates)) return errResponse(400, 'Invalid request body');

  for (const u of updates) {
    if (u.status !== undefined && !PHOTO_STATUSES.includes(u.status)) return errResponse(400, 'Invalid photo status');
    if (u.priceOverrideCents !== undefined && u.priceOverrideCents !== null && !isValidPriceCents(u.priceOverrideCents)) {
      return errResponse(400, 'Price override must be at least $0.50');
    }
    if (u.sortOrder !== undefined && (typeof u.sortOrder !== 'number' || !Number.isFinite(u.sortOrder))) {
      return errResponse(400, 'sortOrder must be a number');
    }
    if (u.photographerId !== undefined) {
      const photographer = await getPhotographer(u.photographerId);
      if (!photographer || !photographer.active) return errResponse(400, 'Photographer not found or inactive');
    }
  }

  const countDeltas = new Map<string, number>();
  let updated = 0;
  for (const u of updates) {
    const photo = await getPhoto(u.id);
    if (!photo) continue;

    const sets: string[] = ['updatedAt = :now'];
    const values: Record<string, unknown> = { ':now': nowIso() };
    const names: Record<string, string> = {};
    if (u.sortOrder !== undefined) { sets.push('sortOrder = :sort'); values[':sort'] = u.sortOrder; }
    if (u.priceOverrideCents !== undefined) { sets.push('priceOverrideCents = :price'); values[':price'] = u.priceOverrideCents; }
    if (u.photographerId !== undefined) { sets.push('photographerId = :pid'); values[':pid'] = u.photographerId; }
    if (u.status !== undefined) {
      sets.push('#status = :status');
      names['#status'] = 'status';
      values[':status'] = u.status;
      const delta = (u.status === 'forSale' ? 1 : 0) - (photo.status === 'forSale' ? 1 : 0);
      countDeltas.set(photo.collectionId, (countDeltas.get(photo.collectionId) ?? 0) + delta);
    }

    await ddb.send(new UpdateCommand({
      TableName: STORE_PHOTOS_TABLE,
      Key: { id: u.id },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeValues: values,
      ...(Object.keys(names).length ? { ExpressionAttributeNames: names } : {}),
    }));
    updated++;
  }
  for (const [collectionId, delta] of countDeltas) await adjustPhotoCount(collectionId, delta);
  return ok({ updated });
}

export async function deleteStorePhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body = readBody<{ ids: string[] }>(event);
  if (!body || !Array.isArray(body.ids)) return errResponse(400, 'ids is required');

  const countDeltas = new Map<string, number>();
  let deleted = 0;
  for (const id of body.ids) {
    const photo = await getPhoto(id);
    if (!photo) continue;
    await Promise.all([
      s3.send(new DeleteObjectCommand({ Bucket: ORIGINALS_BUCKET, Key: photo.originalKey })),
      deleteMediaUrl(photo.previewUrl),
      deleteMediaUrl(photo.thumbnailUrl),
      ddb.send(new DeleteCommand({ TableName: STORE_PHOTOS_TABLE, Key: { id } })),
    ]);
    if (photo.status === 'forSale') countDeltas.set(photo.collectionId, (countDeltas.get(photo.collectionId) ?? 0) - 1);
    deleted++;
  }
  for (const [collectionId, delta] of countDeltas) await adjustPhotoCount(collectionId, delta);
  return ok({ deleted, skipped: [] });
}

// ── Replace original ─────────────────────────────────────────────────────────

export async function presignReplace(event: APIGatewayProxyEventV2, id: string): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body = readBody<StorePhotoReplaceRequest>(event);
  if (!body || !CONTENT_TYPE_EXT[body.contentType]) return errResponse(400, 'File must be a JPEG or PNG');
  const photo = await getPhoto(id);
  if (!photo) return errResponse(404, 'Photo not found');

  return ok(await presignFor(id, body.contentType));
}

export async function completeReplace(event: APIGatewayProxyEventV2, id: string): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body = readBody<StorePhotoReplaceComplete>(event);
  if (!body) return errResponse(400, 'Invalid request body');
  const photo = await getPhoto(id);
  if (!photo) return errResponse(404, 'Photo not found');
  if (!isOriginalKeyFor(body.originalKey, id)) return errResponse(400, 'Invalid original key');
  if (!isStoreMediaUrl(body.previewUrl, 'previews', id) || !isStoreMediaUrl(body.thumbnailUrl, 'thumbs', id)) {
    return errResponse(400, 'Invalid preview or thumbnail URL');
  }
  if (!(await objectExists(ORIGINALS_BUCKET, body.originalKey))) return errResponse(400, 'The new original was not uploaded');

  const next: StorePhoto = {
    ...photo,
    originalKey: body.originalKey,
    originalFilename: body.originalFilename,
    originalBytes: body.originalBytes,
    width: body.width,
    height: body.height,
    contentHash: body.contentHash,
    previewUrl: body.previewUrl,
    thumbnailUrl: body.thumbnailUrl,
    updatedAt: nowIso(),
  };
  await ddb.send(new PutCommand({ TableName: STORE_PHOTOS_TABLE, Item: next }));

  // Clean up superseded objects. A JPEG→PNG replacement changes the original's key.
  const cleanups: Promise<unknown>[] = [];
  if (photo.previewUrl !== next.previewUrl) cleanups.push(deleteMediaUrl(photo.previewUrl));
  if (photo.thumbnailUrl !== next.thumbnailUrl) cleanups.push(deleteMediaUrl(photo.thumbnailUrl));
  if (photo.originalKey !== next.originalKey) {
    cleanups.push(s3.send(new DeleteObjectCommand({ Bucket: ORIGINALS_BUCKET, Key: photo.originalKey })));
  }
  await Promise.all(cleanups);
  return ok(next);
}
