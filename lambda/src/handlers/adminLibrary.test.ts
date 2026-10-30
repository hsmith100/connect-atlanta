import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import {
  listCollections, createCollection, updateCollection, deleteCollection, listCollectionPhotos, listGalleryPhotos,
  presignLibraryPhotos, createLibraryPhotos, updateLibraryPhotos, deleteLibraryPhotos, presignReplace, completeReplace,
} from './adminLibrary';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(async (_client: unknown, cmd: { input: { Bucket: string; Key: string } }) =>
    `https://signed.test/${cmd.input.Bucket}/${cmd.input.Key}`),
}));

const smMock = mockClient(SecretsManagerClient);
const ddbMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);

const KEY = 'test-admin-key';
const COLLECTIONS = 'test-photo-collections';
const PHOTOS = 'test-photo-library';
const PHOTOGRAPHERS = 'test-store-photographers';
const asResult = (r: unknown) => r as APIGatewayProxyStructuredResultV2;
const bodyOf = (r: unknown) => JSON.parse(asResult(r).body as string);

const PID = '11111111-1111-4111-8111-111111111111';
const PID2 = '22222222-2222-4222-8222-222222222222';
const media = (folder: string, id = PID, ts = 100) => `https://media.test/library/${folder}/${id}-${ts}.jpg`;

function makeEvent(body?: unknown, key: string | null = KEY): APIGatewayProxyEventV2 {
  return {
    headers: key ? { 'x-admin-key': key } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  } as unknown as APIGatewayProxyEventV2;
}

const collection = {
  id: 'c1', entity: 'COLLECTION', eventId: 'e1', title: 'Aug 2026', eventDate: '2026-08-15', status: 'draft',
  defaultPriceCents: 1500, defaultPhotographerId: null, coverPhotoId: null, photoCount: 2, forSaleCount: 2,
  createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
};
const photo = {
  id: PID, collectionId: 'c1', sortOrder: 1, originalKey: `originals/${PID}.jpg`, originalFilename: 'IMG_1.jpg',
  originalBytes: 1000, width: 6000, height: 4000, contentHash: 'h1',
  webUrl: media('web'), webThumbUrl: media('web-thumbs'), previewUrl: media('previews'), thumbnailUrl: media('thumbs'),
  photographerId: 'ph1', priceOverrideCents: null, forSale: true, inGallery: false, removed: false, gallerySortOrder: 0,
  createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
};
const activePhotographer = { id: 'ph1', name: 'Jay', email: 'j@x.com', commissionPct: 40, active: true };

function putItem(table: string, index = 0) {
  return ddbMock.commandCalls(PutCommand).filter((c) => c.args[0].input.TableName === table)[index].args[0].input.Item!;
}
function countUpdate() {
  return ddbMock.commandCalls(UpdateCommand).find((c) => c.args[0].input.TableName === COLLECTIONS)?.args[0].input.ExpressionAttributeValues;
}

beforeEach(() => {
  ddbMock.reset();
  s3Mock.reset();
  smMock.reset();
  smMock.on(GetSecretValueCommand).resolves({ SecretString: KEY });
  ddbMock.on(GetCommand, { TableName: PHOTOGRAPHERS }).resolves({ Item: activePhotographer });
});

describe('auth', () => {
  it.each([
    ['listCollections', () => listCollections(makeEvent(undefined, null))],
    ['createCollection', () => createCollection(makeEvent({}, null))],
    ['updateCollection', () => updateCollection(makeEvent({}, null), 'c1')],
    ['deleteCollection', () => deleteCollection(makeEvent(undefined, null), 'c1')],
    ['listCollectionPhotos', () => listCollectionPhotos(makeEvent(undefined, null), 'c1')],
    ['listGalleryPhotos', () => listGalleryPhotos(makeEvent(undefined, null))],
    ['presignLibraryPhotos', () => presignLibraryPhotos(makeEvent([], null))],
    ['createLibraryPhotos', () => createLibraryPhotos(makeEvent([], null))],
    ['updateLibraryPhotos', () => updateLibraryPhotos(makeEvent([], null))],
    ['deleteLibraryPhotos', () => deleteLibraryPhotos(makeEvent({ ids: [] }, null))],
    ['presignReplace', () => presignReplace(makeEvent({}, null), PID)],
    ['completeReplace', () => completeReplace(makeEvent({}, null), PID)],
  ])('%s returns 401 without the admin key', async (_name, call) => {
    expect(asResult(await call()).statusCode).toBe(401);
  });
});

describe('listCollections', () => {
  it('queries byEventDate newest first across pages', async () => {
    ddbMock.on(QueryCommand)
      .resolvesOnce({ Items: [collection], LastEvaluatedKey: { id: 'c1' } })
      .resolvesOnce({ Items: [{ ...collection, id: 'c2' }] });
    const res = await listCollections(makeEvent());
    expect(bodyOf(res).collections.map((c: { id: string }) => c.id)).toEqual(['c1', 'c2']);
    expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, { IndexName: 'byEventDate', ScanIndexForward: false });
  });
});

describe('createCollection', () => {
  beforeEach(() => {
    ddbMock.on(GetCommand, { TableName: 'test-events' }).resolves({ Item: { id: 'e1', title: 'Beats Aug', date: '2026-08-15' } });
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    ddbMock.on(PutCommand).resolves({});
  });

  it('creates a draft collection copying the event title and date, with zero counts', async () => {
    const res = asResult(await createCollection(makeEvent({ eventId: 'e1', defaultPriceCents: 1500 })));
    expect(res.statusCode).toBe(201);
    expect(bodyOf(res)).toMatchObject({
      entity: 'COLLECTION', eventId: 'e1', title: 'Beats Aug', eventDate: '2026-08-15',
      status: 'draft', defaultPriceCents: 1500, photoCount: 0, forSaleCount: 0, coverPhotoId: null,
    });
  });

  it('returns 404 for an unknown event', async () => {
    ddbMock.on(GetCommand, { TableName: 'test-events' }).resolves({});
    expect(asResult(await createCollection(makeEvent({ eventId: 'nope', defaultPriceCents: 1500 }))).statusCode).toBe(404);
  });

  it('returns 409 when the event already has a collection', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [collection] });
    expect(asResult(await createCollection(makeEvent({ eventId: 'e1', defaultPriceCents: 1500 }))).statusCode).toBe(409);
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
  });

  it.each([49, 15.5, undefined])('rejects default price %p', async (price) => {
    expect(asResult(await createCollection(makeEvent({ eventId: 'e1', defaultPriceCents: price }))).statusCode).toBe(400);
  });

  it('rejects an inactive default photographer', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOGRAPHERS }).resolves({ Item: { ...activePhotographer, active: false } });
    const res = await createCollection(makeEvent({ eventId: 'e1', defaultPriceCents: 1500, defaultPhotographerId: 'ph1' }));
    expect(asResult(res).statusCode).toBe(400);
  });
});

describe('updateCollection', () => {
  beforeEach(() => {
    ddbMock.on(GetCommand, { TableName: COLLECTIONS }).resolves({ Item: collection });
    ddbMock.on(PutCommand).resolves({});
  });

  it('returns 404 for an unknown collection', async () => {
    ddbMock.on(GetCommand, { TableName: COLLECTIONS }).resolves({});
    expect(asResult(await updateCollection(makeEvent({ title: 'x' }), 'nope')).statusCode).toBe(404);
  });

  it('updates title and default price', async () => {
    const res = await updateCollection(makeEvent({ title: ' New ', defaultPriceCents: 2000 }), 'c1');
    expect(bodyOf(res)).toMatchObject({ title: 'New', defaultPriceCents: 2000 });
  });

  it('publishes when a photo is for sale with a photographer', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [photo] });
    const res = await updateCollection(makeEvent({ status: 'published' }), 'c1');
    expect(asResult(res).statusCode).toBe(200);
    expect(bodyOf(res).status).toBe('published');
  });

  it.each([
    ['only gallery photos', { forSale: false, inGallery: true }, 'Put at least one photo on sale'],
    ['only removed photos', { removed: true }, 'Put at least one photo on sale'],
  ])('returns 422 with problems when there are %s', async (_label, override, problem) => {
    ddbMock.on(QueryCommand).resolves({ Items: [{ ...photo, ...override }] });
    const res = await updateCollection(makeEvent({ status: 'published' }), 'c1');
    expect(asResult(res).statusCode).toBe(422);
    expect(bodyOf(res).problems).toEqual([problem]);
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
  });

  it('flags for-sale photos without a photographer', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [{ ...photo, photographerId: null }] });
    const res = await updateCollection(makeEvent({ status: 'published' }), 'c1');
    expect(bodyOf(res).problems).toEqual(['1 photo(s) for sale have no photographer assigned']);
  });

  it('always allows unpublishing', async () => {
    ddbMock.on(GetCommand, { TableName: COLLECTIONS }).resolves({ Item: { ...collection, status: 'published' } });
    const res = await updateCollection(makeEvent({ status: 'draft' }), 'c1');
    expect(bodyOf(res).status).toBe('draft');
    expect(ddbMock).not.toHaveReceivedCommand(QueryCommand);
  });

  it('rejects a cover photo from another collection', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({ Item: { ...photo, collectionId: 'other' } });
    expect(asResult(await updateCollection(makeEvent({ coverPhotoId: PID }), 'c1')).statusCode).toBe(400);
  });
});

describe('deleteCollection', () => {
  it('returns 409 while photos remain', async () => {
    ddbMock.on(GetCommand, { TableName: COLLECTIONS }).resolves({ Item: collection });
    ddbMock.on(QueryCommand).resolves({ Items: [photo] });
    expect(asResult(await deleteCollection(makeEvent(), 'c1')).statusCode).toBe(409);
  });

  it('deletes an empty collection', async () => {
    ddbMock.on(GetCommand, { TableName: COLLECTIONS }).resolves({ Item: { ...collection, photoCount: 0 } });
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    const res = await deleteCollection(makeEvent(), 'c1');
    expect(bodyOf(res)).toEqual({ deleted: true });
  });
});

describe('listCollectionPhotos / listGalleryPhotos', () => {
  it('returns collection photos sorted, without galleryKey', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [{ ...photo, id: 'b', sortOrder: 2, galleryKey: 'GALLERY' }, { ...photo, id: 'a', sortOrder: 1 }] });
    const { photos } = bodyOf(await listCollectionPhotos(makeEvent(), 'c1'));
    expect(photos.map((p: { id: string }) => p.id)).toEqual(['a', 'b']);
    expect(photos[1]).not.toHaveProperty('galleryKey');
  });

  it('lists gallery photos from the byGallery index', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [{ ...photo, inGallery: true, galleryKey: 'GALLERY' }] });
    const { photos } = bodyOf(await listGalleryPhotos(makeEvent()));
    expect(photos).toHaveLength(1);
    expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, { IndexName: 'byGallery', KeyConditionExpression: 'galleryKey = :g' });
  });
});

describe('presignLibraryPhotos', () => {
  it('signs the original privately and all four public versions in the media bucket', async () => {
    const [item] = bodyOf(await presignLibraryPhotos(makeEvent([{ id: PID, filename: 'a.png', contentType: 'image/png', bytes: 10 }])));
    expect(item.originalKey).toBe(`originals/${PID}.png`);
    expect(item.originalUploadUrl).toBe(`https://signed.test/test-originals-bucket/originals/${PID}.png`);
    for (const [field, folder] of [['webUploadUrl', 'web'], ['webThumbUploadUrl', 'web-thumbs'], ['previewUploadUrl', 'previews'], ['thumbUploadUrl', 'thumbs']]) {
      expect(item[field]).toMatch(new RegExp(`^https://signed.test/test-media-bucket/library/${folder}/${PID}-\\d+\\.jpg$`));
    }
    expect(item.webUrl).toMatch(new RegExp(`^https://media.test/library/web/${PID}-\\d+\\.jpg$`));
  });

  it('rejects non-image types, non-UUID ids, and bad batch sizes', async () => {
    expect(asResult(await presignLibraryPhotos(makeEvent([{ id: PID, filename: 'a.gif', contentType: 'image/gif', bytes: 1 }]))).statusCode).toBe(400);
    expect(asResult(await presignLibraryPhotos(makeEvent([{ id: '../evil', filename: 'a.jpg', contentType: 'image/jpeg', bytes: 1 }]))).statusCode).toBe(400);
    expect(asResult(await presignLibraryPhotos(makeEvent([]))).statusCode).toBe(400);
    const many = Array.from({ length: 51 }, () => ({ id: PID, filename: 'a.jpg', contentType: 'image/jpeg', bytes: 1 }));
    expect(asResult(await presignLibraryPhotos(makeEvent(many))).statusCode).toBe(400);
  });
});

describe('createLibraryPhotos', () => {
  const payload = {
    id: PID, collectionId: 'c1', originalKey: `originals/${PID}.jpg`, originalFilename: 'IMG_1.jpg',
    originalBytes: 1000, width: 6000, height: 4000, contentHash: 'h1',
    webUrl: media('web'), webThumbUrl: media('web-thumbs'), previewUrl: media('previews'), thumbnailUrl: media('thumbs'),
    photographerId: 'ph1', sortOrder: 3, forSale: true, inGallery: false,
  };

  beforeEach(() => {
    ddbMock.on(GetCommand, { TableName: COLLECTIONS }).resolves({ Item: collection });
    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(QueryCommand).resolves({ Items: [{ gallerySortOrder: 70 }] });
    s3Mock.on(HeadObjectCommand).resolves({});
  });

  it('creates a for-sale photo (not in gallery, no galleryKey) and increments both counts', async () => {
    expect(asResult(await createLibraryPhotos(makeEvent([payload]))).statusCode).toBe(201);
    const item = putItem(PHOTOS);
    expect(item).toMatchObject({ id: PID, forSale: true, inGallery: false, removed: false, priceOverrideCents: null });
    expect(item).not.toHaveProperty('galleryKey');
    expect(countUpdate()).toMatchObject({ ':p': 1, ':f': 1 });
  });

  it('puts gallery photos at the end of the gallery order with galleryKey', async () => {
    await createLibraryPhotos(makeEvent([
      { ...payload, inGallery: true },
      { ...payload, id: PID2, originalKey: `originals/${PID2}.jpg`, inGallery: true, forSale: false, photographerId: null,
        webUrl: media('web', PID2), webThumbUrl: media('web-thumbs', PID2), previewUrl: media('previews', PID2), thumbnailUrl: media('thumbs', PID2) },
    ]));
    expect(putItem(PHOTOS, 0)).toMatchObject({ galleryKey: 'GALLERY', gallerySortOrder: 80 });
    expect(putItem(PHOTOS, 1)).toMatchObject({ galleryKey: 'GALLERY', gallerySortOrder: 90, photographerId: null });
    expect(countUpdate()).toMatchObject({ ':p': 2, ':f': 1 });
  });

  it('allows gallery-only photos without a photographer but requires one for sale', async () => {
    const res = await createLibraryPhotos(makeEvent([{ ...payload, photographerId: null }]));
    expect(asResult(res).statusCode).toBe(400);
    expect(bodyOf(res).error).toBe('Choose a photographer for photos that are for sale');
  });

  it('returns 400 when the original was never uploaded', async () => {
    s3Mock.on(HeadObjectCommand).rejects(new Error('NotFound'));
    const res = await createLibraryPhotos(makeEvent([payload]));
    expect(bodyOf(res).error).toBe('The original for IMG_1.jpg was not uploaded');
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
  });

  it.each([
    ['original key for another photo', { originalKey: `originals/${PID2}.jpg` }],
    ['web version in the wrong folder', { webUrl: media('previews') }],
    ['web thumbnail on another domain', { webThumbUrl: `https://evil.test/library/web-thumbs/${PID}-1.jpg` }],
    ['missing switches', { forSale: undefined }],
  ])('rejects %s', async (_label, override) => {
    expect(asResult(await createLibraryPhotos(makeEvent([{ ...payload, ...override }]))).statusCode).toBe(400);
  });

  it('rejects photos spanning multiple collections', async () => {
    const res = await createLibraryPhotos(makeEvent([payload, { ...payload, id: PID2, collectionId: 'c2' }]));
    expect(asResult(res).statusCode).toBe(400);
  });
});

describe('updateLibraryPhotos', () => {
  beforeEach(() => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({ Item: photo });
    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(QueryCommand).resolves({ Items: [{ gallerySortOrder: 40 }] });
  });

  it('adding to the gallery sets galleryKey and appends to the gallery order', async () => {
    await updateLibraryPhotos(makeEvent([{ id: PID, inGallery: true }]));
    expect(putItem(PHOTOS)).toMatchObject({ inGallery: true, galleryKey: 'GALLERY', gallerySortOrder: 50 });
    expect(countUpdate()).toBeUndefined();
  });

  it('removing from the gallery drops galleryKey', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({ Item: { ...photo, inGallery: true, galleryKey: 'GALLERY', gallerySortOrder: 20 } });
    await updateLibraryPhotos(makeEvent([{ id: PID, inGallery: false }]));
    expect(putItem(PHOTOS)).not.toHaveProperty('galleryKey');
  });

  it('takedown (removed) hides from gallery and store and updates both counts', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({ Item: { ...photo, inGallery: true, galleryKey: 'GALLERY' } });
    await updateLibraryPhotos(makeEvent([{ id: PID, removed: true }]));
    expect(putItem(PHOTOS)).not.toHaveProperty('galleryKey');
    expect(countUpdate()).toMatchObject({ ':p': -1, ':f': -1 });
  });

  it('taking off sale only changes forSaleCount', async () => {
    await updateLibraryPhotos(makeEvent([{ id: PID, forSale: false }]));
    expect(countUpdate()).toMatchObject({ ':p': 0, ':f': -1 });
  });

  it('saves an explicit gallery order without re-appending', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({ Item: { ...photo, inGallery: true, galleryKey: 'GALLERY', gallerySortOrder: 20 } });
    await updateLibraryPhotos(makeEvent([{ id: PID, gallerySortOrder: 5 }]));
    expect(putItem(PHOTOS)).toMatchObject({ gallerySortOrder: 5, galleryKey: 'GALLERY' });
    expect(ddbMock).not.toHaveReceivedCommand(QueryCommand);
  });

  it('refuses to put a photo on sale without a photographer, writing nothing', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({ Item: { ...photo, forSale: false, photographerId: null } });
    const res = await updateLibraryPhotos(makeEvent([{ id: PID, forSale: true }]));
    expect(asResult(res).statusCode).toBe(400);
    expect(bodyOf(res).error).toBe('Assign a photographer to IMG_1.jpg before putting it on sale');
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
  });

  it('accepts putting on sale and assigning a photographer in the same update', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({ Item: { ...photo, forSale: false, photographerId: null } });
    expect(asResult(await updateLibraryPhotos(makeEvent([{ id: PID, forSale: true, photographerId: 'ph1' }]))).statusCode).toBe(200);
    expect(putItem(PHOTOS)).toMatchObject({ forSale: true, photographerId: 'ph1' });
  });

  it.each([
    [{ id: PID, forSale: 'yes' }],
    [{ id: PID, priceOverrideCents: 10 }],
    [{ id: PID, sortOrder: 'first' }],
    [{ id: PID, gallerySortOrder: null }],
  ])('rejects invalid update %p before writing anything', async (u) => {
    expect(asResult(await updateLibraryPhotos(makeEvent([u]))).statusCode).toBe(400);
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
  });
});

describe('deleteLibraryPhotos', () => {
  it('deletes the original and all four public versions, and decrements both counts', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({});
    ddbMock.on(GetCommand, { TableName: PHOTOS, Key: { id: PID } }).resolves({ Item: photo });
    ddbMock.on(DeleteCommand).resolves({});
    ddbMock.on(UpdateCommand).resolves({});
    s3Mock.on(DeleteObjectCommand).resolves({});

    expect(bodyOf(await deleteLibraryPhotos(makeEvent({ ids: [PID, 'missing'] })))).toEqual({ deleted: 1, skipped: [] });
    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: 'test-originals-bucket', Key: `originals/${PID}.jpg` });
    for (const folder of ['web', 'web-thumbs', 'previews', 'thumbs']) {
      expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: 'test-media-bucket', Key: `library/${folder}/${PID}-100.jpg` });
    }
    expect(countUpdate()).toMatchObject({ ':p': -1, ':f': -1 });
  });
});

describe('presignReplace / completeReplace', () => {
  beforeEach(() => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({ Item: { ...photo, inGallery: true, galleryKey: 'GALLERY' } });
    ddbMock.on(PutCommand).resolves({});
    s3Mock.on(HeadObjectCommand).resolves({});
    s3Mock.on(DeleteObjectCommand).resolves({});
  });

  it('presigns new URLs for an existing photo', async () => {
    expect(bodyOf(await presignReplace(makeEvent({ contentType: 'image/jpeg' }), PID)).originalKey).toBe(`originals/${PID}.jpg`);
  });

  it('returns 404 for an unknown photo', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({});
    expect(asResult(await presignReplace(makeEvent({ contentType: 'image/jpeg' }), PID)).statusCode).toBe(404);
  });

  const complete = {
    originalKey: `originals/${PID}.png`, originalFilename: 'new.png', originalBytes: 2000, width: 3000, height: 2000, contentHash: 'h2',
    webUrl: media('web', PID, 200), webThumbUrl: media('web-thumbs', PID, 200), previewUrl: media('previews', PID, 200), thumbnailUrl: media('thumbs', PID, 200),
  };

  it('saves new versions, keeps switches and gallery membership, and deletes superseded objects', async () => {
    const res = await completeReplace(makeEvent(complete), PID);
    expect(bodyOf(res)).toMatchObject({ originalKey: `originals/${PID}.png`, contentHash: 'h2', forSale: true, inGallery: true });
    expect(bodyOf(res)).not.toHaveProperty('galleryKey');
    expect(putItem(PHOTOS)).toMatchObject({ galleryKey: 'GALLERY' });
    for (const folder of ['web', 'web-thumbs', 'previews', 'thumbs']) {
      expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: 'test-media-bucket', Key: `library/${folder}/${PID}-100.jpg` });
    }
    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: 'test-originals-bucket', Key: `originals/${PID}.jpg` });
  });

  it('keeps the original when the key is unchanged', async () => {
    await completeReplace(makeEvent({ ...complete, originalKey: `originals/${PID}.jpg` }), PID);
    expect(s3Mock).not.toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: 'test-originals-bucket' });
  });

  it('rejects when the new original was not uploaded', async () => {
    s3Mock.on(HeadObjectCommand).rejects(new Error('NotFound'));
    expect(asResult(await completeReplace(makeEvent(complete), PID)).statusCode).toBe(400);
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
  });
});
