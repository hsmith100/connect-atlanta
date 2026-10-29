import {
  QueryCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type {
  PhotoCollection, LibraryPhoto, CollectionCreatePayload, CollectionUpdatePayload,
  LibraryPresignRequest, LibraryPresignResponse, LibraryPhotoCreatePayload, LibraryPhotoUpdatePayload,
  LibraryPhotoReplaceRequest, LibraryPhotoReplaceComplete,
} from '../../../shared/types/store';
import { ok, errResponse, requireAdmin } from '../lib/photoShared';
import {
  ddb, s3, PHOTO_COLLECTIONS_TABLE, PHOTO_LIBRARY_TABLE, EVENTS_TABLE, MEDIA_BUCKET, ORIGINALS_BUCKET,
  CLOUDFRONT_DOMAIN, newId, nowIso, readBody, json, created, mediaUrl, isValidPriceCents,
} from '../lib/storeShared';
import { getPhotographer } from './adminStorePhotographers';

const UPLOAD_URL_TTL_SECONDS = 900;
const MAX_PRESIGN_BATCH = 50;
const GALLERY_STEP = 10;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CONTENT_TYPE_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png' };

type MediaFolder = 'web' | 'web-thumbs' | 'previews' | 'thumbs';
const MEDIA_FIELDS: Record<MediaFolder, 'webUrl' | 'webThumbUrl' | 'previewUrl' | 'thumbnailUrl'> = {
  'web': 'webUrl',
  'web-thumbs': 'webThumbUrl',
  'previews': 'previewUrl',
  'thumbs': 'thumbnailUrl',
};

// Stored photos carry galleryKey only while they're in the Gallery (sparse byGallery index).
type StoredPhoto = LibraryPhoto & { galleryKey?: 'GALLERY' };

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getCollection(id: string): Promise<PhotoCollection | null> {
  const r = await ddb.send(new GetCommand({ TableName: PHOTO_COLLECTIONS_TABLE, Key: { id } }));
  return (r.Item as PhotoCollection | undefined) ?? null;
}

async function getPhoto(id: string): Promise<StoredPhoto | null> {
  const r = await ddb.send(new GetCommand({ TableName: PHOTO_LIBRARY_TABLE, Key: { id } }));
  return (r.Item as StoredPhoto | undefined) ?? null;
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

function queryAllCollections(): Promise<PhotoCollection[]> {
  return queryAll<PhotoCollection>({
    TableName: PHOTO_COLLECTIONS_TABLE,
    IndexName: 'byEventDate',
    KeyConditionExpression: 'entity = :e',
    ExpressionAttributeValues: { ':e': 'COLLECTION' },
    ScanIndexForward: false,
  });
}

export function queryCollectionPhotos(collectionId: string): Promise<StoredPhoto[]> {
  return queryAll<StoredPhoto>({
    TableName: PHOTO_LIBRARY_TABLE,
    IndexName: 'byCollection',
    KeyConditionExpression: 'collectionId = :c',
    ExpressionAttributeValues: { ':c': collectionId },
  });
}

export function queryGalleryPhotos(): Promise<StoredPhoto[]> {
  return queryAll<StoredPhoto>({
    TableName: PHOTO_LIBRARY_TABLE,
    IndexName: 'byGallery',
    KeyConditionExpression: 'galleryKey = :g',
    ExpressionAttributeValues: { ':g': 'GALLERY' },
  });
}

async function nextGallerySortOrder(): Promise<number> {
  const r = await ddb.send(new QueryCommand({
    TableName: PHOTO_LIBRARY_TABLE,
    IndexName: 'byGallery',
    KeyConditionExpression: 'galleryKey = :g',
    ExpressionAttributeValues: { ':g': 'GALLERY' },
    ScanIndexForward: false,
    Limit: 1,
  }));
  const last = r.Items?.[0] as StoredPhoto | undefined;
  return (last?.gallerySortOrder ?? 0) + GALLERY_STEP;
}

// Keep galleryKey in sync with the switches: present exactly when the photo is in the Gallery.
function withGalleryKey(photo: StoredPhoto): StoredPhoto {
  const { galleryKey: _old, ...rest } = photo;
  return rest.inGallery && !rest.removed ? { ...rest, galleryKey: 'GALLERY' } : rest;
}

function toLibraryPhoto(photo: StoredPhoto): LibraryPhoto {
  const { galleryKey: _key, ...rest } = photo;
  return rest;
}

function counts(photo: Pick<LibraryPhoto, 'forSale' | 'removed'>): { photo: number; forSale: number } {
  return { photo: photo.removed ? 0 : 1, forSale: photo.forSale && !photo.removed ? 1 : 0 };
}

async function adjustCounts(collectionId: string, photoDelta: number, forSaleDelta: number): Promise<void> {
  if (photoDelta === 0 && forSaleDelta === 0) return;
  await ddb.send(new UpdateCommand({
    TableName: PHOTO_COLLECTIONS_TABLE,
    Key: { id: collectionId },
    UpdateExpression: 'ADD photoCount :p, forSaleCount :f SET updatedAt = :now',
    ExpressionAttributeValues: { ':p': photoDelta, ':f': forSaleDelta, ':now': nowIso() },
  }));
}

function mediaKeyFromUrl(url: string): string | null {
  const prefix = `https://${CLOUDFRONT_DOMAIN}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

function isLibraryMediaUrl(url: unknown, folder: MediaFolder, id: string): url is string {
  if (typeof url !== 'string') return false;
  const key = mediaKeyFromUrl(url);
  return key !== null && new RegExp(`^library/${folder}/${id}-\\d+\\.jpg$`).test(key);
}

function hasValidMediaUrls(body: Record<string, unknown>, id: string): boolean {
  return (Object.keys(MEDIA_FIELDS) as MediaFolder[]).every((folder) => isLibraryMediaUrl(body[MEDIA_FIELDS[folder]], folder, id));
}

function isOriginalKeyFor(key: unknown, id: string): key is string {
  return typeof key === 'string' && new RegExp(`^originals/${id}\\.(jpg|png)$`).test(key);
}

async function presignFor(id: string, contentType: string): Promise<LibraryPresignResponse> {
  const ext = CONTENT_TYPE_EXT[contentType];
  const ts = Date.now();
  const originalKey = `originals/${id}.${ext}`;
  const key = (folder: MediaFolder) => `library/${folder}/${id}-${ts}.jpg`;
  const sign = (Bucket: string, Key: string, ContentType: string) =>
    getSignedUrl(s3, new PutObjectCommand({ Bucket, Key, ContentType }), { expiresIn: UPLOAD_URL_TTL_SECONDS });

  const [originalUploadUrl, webUploadUrl, webThumbUploadUrl, previewUploadUrl, thumbUploadUrl] = await Promise.all([
    sign(ORIGINALS_BUCKET, originalKey, contentType),
    sign(MEDIA_BUCKET, key('web'), 'image/jpeg'),
    sign(MEDIA_BUCKET, key('web-thumbs'), 'image/jpeg'),
    sign(MEDIA_BUCKET, key('previews'), 'image/jpeg'),
    sign(MEDIA_BUCKET, key('thumbs'), 'image/jpeg'),
  ]);
  return {
    id, originalKey, originalUploadUrl, webUploadUrl, webThumbUploadUrl, previewUploadUrl, thumbUploadUrl,
    webUrl: mediaUrl(key('web')),
    webThumbUrl: mediaUrl(key('web-thumbs')),
    previewUrl: mediaUrl(key('previews')),
    thumbnailUrl: mediaUrl(key('thumbs')),
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

function publicUrls(photo: LibraryPhoto): string[] {
  return [photo.webUrl, photo.webThumbUrl, photo.previewUrl, photo.thumbnailUrl];
}

// Store-listing preconditions (data-model.md). Photographer payment readiness is added by US5.
async function publishProblems(collection: PhotoCollection): Promise<string[]> {
  const problems: string[] = [];
  if (!isValidPriceCents(collection.defaultPriceCents)) problems.push('Set a default price of at least $0.50');
  const forSale = (await queryCollectionPhotos(collection.id)).filter((p) => p.forSale && !p.removed);
  if (forSale.length === 0) problems.push('Put at least one photo on sale');
  const missing = forSale.filter((p) => !p.photographerId).length;
  if (missing > 0) problems.push(`${missing} photo(s) for sale have no photographer assigned`);
  return problems;
}

async function activePhotographerOk(id: string, cache: Map<string, boolean>): Promise<boolean> {
  if (!cache.has(id)) {
    const photographer = await getPhotographer(id);
    cache.set(id, !!photographer && photographer.active);
  }
  return cache.get(id)!;
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
  const collection: PhotoCollection = {
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
    forSaleCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: PHOTO_COLLECTIONS_TABLE, Item: collection }));
  return created(collection);
}

export async function updateCollection(event: APIGatewayProxyEventV2, id: string): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body = readBody<CollectionUpdatePayload>(event);
  if (!body) return errResponse(400, 'Invalid request body');
  const collection = await getCollection(id);
  if (!collection) return errResponse(404, 'Collection not found');

  const next: PhotoCollection = { ...collection };
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
  await ddb.send(new PutCommand({ TableName: PHOTO_COLLECTIONS_TABLE, Item: next }));
  return ok(next);
}

export async function deleteCollection(event: APIGatewayProxyEventV2, id: string): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const collection = await getCollection(id);
  if (!collection) return errResponse(404, 'Collection not found');
  const photos = await queryCollectionPhotos(id);
  if (photos.length > 0) return errResponse(409, 'Delete or remove all photos in this collection first');

  await ddb.send(new DeleteCommand({ TableName: PHOTO_COLLECTIONS_TABLE, Key: { id } }));
  return ok({ deleted: true });
}

// ── Photos ───────────────────────────────────────────────────────────────────

export async function listCollectionPhotos(event: APIGatewayProxyEventV2, collectionId: string): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;
  const photos = (await queryCollectionPhotos(collectionId)).sort((a, b) => a.sortOrder - b.sortOrder);
  return ok({ photos: photos.map(toLibraryPhoto) });
}

export async function listGalleryPhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;
  return ok({ photos: (await queryGalleryPhotos()).map(toLibraryPhoto) });
}

export async function presignLibraryPhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const requests = readBody<LibraryPresignRequest[]>(event);
  if (!Array.isArray(requests) || requests.length === 0) return errResponse(400, 'Send between 1 and 50 files');
  if (requests.length > MAX_PRESIGN_BATCH) return errResponse(400, `Send at most ${MAX_PRESIGN_BATCH} files per request`);
  for (const req of requests) {
    if (typeof req.id !== 'string' || !UUID_RE.test(req.id)) return errResponse(400, 'Each file needs a valid id');
    if (!CONTENT_TYPE_EXT[req.contentType]) return errResponse(400, `${req.filename ?? 'File'} must be a JPEG or PNG`);
  }

  return ok(await Promise.all(requests.map((req) => presignFor(req.id, req.contentType))));
}

export async function createLibraryPhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const payloads = readBody<LibraryPhotoCreatePayload[]>(event);
  if (!Array.isArray(payloads) || payloads.length === 0) return errResponse(400, 'No photos to create');

  const collectionIds = new Set(payloads.map((p) => p.collectionId));
  if (collectionIds.size !== 1) return errResponse(400, 'All photos must belong to one collection');
  const collection = await getCollection(payloads[0].collectionId);
  if (!collection) return errResponse(404, 'Collection not found');

  const photographerOk = new Map<string, boolean>();
  for (const p of payloads) {
    if (!UUID_RE.test(p.id)) return errResponse(400, 'Invalid photo id');
    if (!isOriginalKeyFor(p.originalKey, p.id)) return errResponse(400, 'Invalid original key');
    if (!hasValidMediaUrls(p as unknown as Record<string, unknown>, p.id)) return errResponse(400, 'Invalid photo version URL');
    if (typeof p.forSale !== 'boolean' || typeof p.inGallery !== 'boolean') return errResponse(400, 'forSale and inGallery are required');
    if (p.forSale && !p.photographerId) return errResponse(400, 'Choose a photographer for photos that are for sale');
    if (p.photographerId && !(await activePhotographerOk(p.photographerId, photographerOk))) {
      return errResponse(400, 'Photographer not found or inactive');
    }
    if (!(await objectExists(ORIGINALS_BUCKET, p.originalKey))) {
      return errResponse(400, `The original for ${p.originalFilename} was not uploaded`);
    }
  }

  const now = nowIso();
  let gallerySort = payloads.some((p) => p.inGallery) ? await nextGallerySortOrder() : 0;
  let forSaleAdded = 0;
  for (const p of payloads) {
    const photo: StoredPhoto = withGalleryKey({
      id: p.id,
      collectionId: p.collectionId,
      sortOrder: p.sortOrder,
      originalKey: p.originalKey,
      originalFilename: p.originalFilename,
      originalBytes: p.originalBytes,
      width: p.width,
      height: p.height,
      contentHash: p.contentHash,
      webUrl: p.webUrl,
      webThumbUrl: p.webThumbUrl,
      previewUrl: p.previewUrl,
      thumbnailUrl: p.thumbnailUrl,
      photographerId: p.photographerId ?? null,
      priceOverrideCents: null,
      forSale: p.forSale,
      inGallery: p.inGallery,
      removed: false,
      gallerySortOrder: p.inGallery ? gallerySort : 0,
      createdAt: now,
      updatedAt: now,
    });
    if (p.inGallery) gallerySort += GALLERY_STEP;
    if (p.forSale) forSaleAdded++;
    await ddb.send(new PutCommand({
      TableName: PHOTO_LIBRARY_TABLE,
      Item: photo,
      ConditionExpression: 'attribute_not_exists(id)',
    }));
  }
  await adjustCounts(collection.id, payloads.length, forSaleAdded);
  return created({ created: payloads.length });
}

export async function updateLibraryPhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const updates = readBody<LibraryPhotoUpdatePayload[]>(event);
  if (!Array.isArray(updates)) return errResponse(400, 'Invalid request body');

  const photographerOk = new Map<string, boolean>();
  for (const u of updates) {
    for (const flag of ['forSale', 'inGallery', 'removed'] as const) {
      if (u[flag] !== undefined && typeof u[flag] !== 'boolean') return errResponse(400, `${flag} must be true or false`);
    }
    if (u.priceOverrideCents !== undefined && u.priceOverrideCents !== null && !isValidPriceCents(u.priceOverrideCents)) {
      return errResponse(400, 'Price override must be at least $0.50');
    }
    for (const field of ['sortOrder', 'gallerySortOrder'] as const) {
      if (u[field] !== undefined && (typeof u[field] !== 'number' || !Number.isFinite(u[field]))) {
        return errResponse(400, `${field} must be a number`);
      }
    }
    if (u.photographerId !== undefined && !(await activePhotographerOk(u.photographerId, photographerOk))) {
      return errResponse(400, 'Photographer not found or inactive');
    }
  }

  // Load everything first so a validation failure (e.g. for sale without a photographer) writes nothing.
  const planned: { before: StoredPhoto; after: StoredPhoto }[] = [];
  let galleryEnd: number | null = null;
  for (const u of updates) {
    const before = await getPhoto(u.id);
    if (!before) continue;
    const after: StoredPhoto = { ...before, updatedAt: nowIso() };
    if (u.sortOrder !== undefined) after.sortOrder = u.sortOrder;
    if (u.priceOverrideCents !== undefined) after.priceOverrideCents = u.priceOverrideCents;
    if (u.photographerId !== undefined) after.photographerId = u.photographerId;
    if (u.forSale !== undefined) after.forSale = u.forSale;
    if (u.removed !== undefined) after.removed = u.removed;
    if (u.inGallery !== undefined) after.inGallery = u.inGallery;
    if (u.gallerySortOrder !== undefined) {
      after.gallerySortOrder = u.gallerySortOrder;
    } else if (after.inGallery && !before.inGallery) {
      galleryEnd = galleryEnd ?? await nextGallerySortOrder();
      after.gallerySortOrder = galleryEnd;
      galleryEnd += GALLERY_STEP;
    }
    if (after.forSale && !after.removed && !after.photographerId) {
      return errResponse(400, `Assign a photographer to ${before.originalFilename} before putting it on sale`);
    }
    planned.push({ before, after: withGalleryKey(after) });
  }

  const deltas = new Map<string, { photo: number; forSale: number }>();
  for (const { before, after } of planned) {
    await ddb.send(new PutCommand({ TableName: PHOTO_LIBRARY_TABLE, Item: after }));
    const b = counts(before);
    const a = counts(after);
    const d = deltas.get(after.collectionId) ?? { photo: 0, forSale: 0 };
    deltas.set(after.collectionId, { photo: d.photo + a.photo - b.photo, forSale: d.forSale + a.forSale - b.forSale });
  }
  for (const [collectionId, d] of deltas) await adjustCounts(collectionId, d.photo, d.forSale);
  return ok({ updated: planned.length });
}

export async function deleteLibraryPhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body = readBody<{ ids: string[] }>(event);
  if (!body || !Array.isArray(body.ids)) return errResponse(400, 'ids is required');

  const deltas = new Map<string, { photo: number; forSale: number }>();
  let deleted = 0;
  for (const id of body.ids) {
    const photo = await getPhoto(id);
    if (!photo) continue;
    await Promise.all([
      s3.send(new DeleteObjectCommand({ Bucket: ORIGINALS_BUCKET, Key: photo.originalKey })),
      ...publicUrls(photo).map(deleteMediaUrl),
      ddb.send(new DeleteCommand({ TableName: PHOTO_LIBRARY_TABLE, Key: { id } })),
    ]);
    const c = counts(photo);
    const d = deltas.get(photo.collectionId) ?? { photo: 0, forSale: 0 };
    deltas.set(photo.collectionId, { photo: d.photo - c.photo, forSale: d.forSale - c.forSale });
    deleted++;
  }
  for (const [collectionId, d] of deltas) await adjustCounts(collectionId, d.photo, d.forSale);
  return ok({ deleted, skipped: [] });
}

// ── Replace original ─────────────────────────────────────────────────────────

export async function presignReplace(event: APIGatewayProxyEventV2, id: string): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body = readBody<LibraryPhotoReplaceRequest>(event);
  if (!body || !CONTENT_TYPE_EXT[body.contentType]) return errResponse(400, 'File must be a JPEG or PNG');
  const photo = await getPhoto(id);
  if (!photo) return errResponse(404, 'Photo not found');

  return ok(await presignFor(id, body.contentType));
}

export async function completeReplace(event: APIGatewayProxyEventV2, id: string): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body = readBody<LibraryPhotoReplaceComplete>(event);
  if (!body) return errResponse(400, 'Invalid request body');
  const photo = await getPhoto(id);
  if (!photo) return errResponse(404, 'Photo not found');
  if (!isOriginalKeyFor(body.originalKey, id)) return errResponse(400, 'Invalid original key');
  if (!hasValidMediaUrls(body as unknown as Record<string, unknown>, id)) return errResponse(400, 'Invalid photo version URL');
  if (!(await objectExists(ORIGINALS_BUCKET, body.originalKey))) return errResponse(400, 'The new original was not uploaded');

  const next: StoredPhoto = {
    ...photo,
    originalKey: body.originalKey,
    originalFilename: body.originalFilename,
    originalBytes: body.originalBytes,
    width: body.width,
    height: body.height,
    contentHash: body.contentHash,
    webUrl: body.webUrl,
    webThumbUrl: body.webThumbUrl,
    previewUrl: body.previewUrl,
    thumbnailUrl: body.thumbnailUrl,
    updatedAt: nowIso(),
  };
  await ddb.send(new PutCommand({ TableName: PHOTO_LIBRARY_TABLE, Item: next }));

  // Clean up superseded objects. A JPEG→PNG replacement changes the original's key.
  const stale = publicUrls(photo).filter((url) => !publicUrls(next).includes(url));
  await Promise.all([
    ...stale.map(deleteMediaUrl),
    ...(photo.originalKey !== next.originalKey
      ? [s3.send(new DeleteObjectCommand({ Bucket: ORIGINALS_BUCKET, Key: photo.originalKey }))]
      : []),
  ]);
  return ok(toLibraryPhoto(next));
}
