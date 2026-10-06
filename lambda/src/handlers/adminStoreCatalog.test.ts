import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import {
  listCollections, createCollection, updateCollection, deleteCollection, listCollectionPhotos,
  presignStorePhotos, createStorePhotos, updateStorePhotos, deleteStorePhotos, presignReplace, completeReplace,
} from './adminStoreCatalog';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(async (_client: unknown, cmd: { input: { Bucket: string; Key: string } }) =>
    `https://signed.test/${cmd.input.Bucket}/${cmd.input.Key}`),
}));

const smMock = mockClient(SecretsManagerClient);
const ddbMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);

const KEY = 'test-admin-key';
const COLLECTIONS = 'test-store-collections';
const PHOTOS = 'test-store-photos';
const PHOTOGRAPHERS = 'test-store-photographers';
const asResult = (r: unknown) => r as APIGatewayProxyStructuredResultV2;
const bodyOf = (r: unknown) => JSON.parse(asResult(r).body as string);

const PID = '11111111-1111-4111-8111-111111111111';
const PID2 = '22222222-2222-4222-8222-222222222222';

function makeEvent(body?: unknown, key: string | null = KEY): APIGatewayProxyEventV2 {
  return {
    headers: key ? { 'x-admin-key': key } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  } as unknown as APIGatewayProxyEventV2;
}

const collection = {
  id: 'c1', entity: 'COLLECTION', eventId: 'e1', title: 'Aug 2026', eventDate: '2026-08-15', status: 'draft',
  defaultPriceCents: 1500, defaultPhotographerId: null, coverPhotoId: null, photoCount: 2,
  createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
};
const photo = {
  id: PID, collectionId: 'c1', sortOrder: 1, originalKey: `originals/${PID}.jpg`, originalFilename: 'IMG_1.jpg',
  originalBytes: 1000, width: 6000, height: 4000, contentHash: 'h1',
  previewUrl: `https://media.test/store/previews/${PID}-100.jpg`,
  thumbnailUrl: `https://media.test/store/thumbs/${PID}-100.jpg`,
  photographerId: 'ph1', priceOverrideCents: null, status: 'forSale',
  createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
};
const activePhotographer = { id: 'ph1', name: 'Jay', email: 'j@x.com', commissionPct: 40, active: true };

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
    ['presignStorePhotos', () => presignStorePhotos(makeEvent([], null))],
    ['createStorePhotos', () => createStorePhotos(makeEvent([], null))],
    ['updateStorePhotos', () => updateStorePhotos(makeEvent([], null))],
    ['deleteStorePhotos', () => deleteStorePhotos(makeEvent({ ids: [] }, null))],
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

  it('creates a draft collection copying the event title and date', async () => {
    const res = asResult(await createCollection(makeEvent({ eventId: 'e1', defaultPriceCents: 1500 })));
    expect(res.statusCode).toBe(201);
    expect(bodyOf(res)).toMatchObject({
      entity: 'COLLECTION', eventId: 'e1', title: 'Beats Aug', eventDate: '2026-08-15',
      status: 'draft', defaultPriceCents: 1500, photoCount: 0, coverPhotoId: null,
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

  it('publishes when preconditions pass', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [photo] });
    const res = await updateCollection(makeEvent({ status: 'published' }), 'c1');
    expect(asResult(res).statusCode).toBe(200);
    expect(bodyOf(res).status).toBe('published');
  });

  it('returns 422 with problems when there are no photos for sale', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [{ ...photo, status: 'hidden' }] });
    const res = await updateCollection(makeEvent({ status: 'published' }), 'c1');
    expect(asResult(res).statusCode).toBe(422);
    expect(bodyOf(res).problems).toEqual(['Add at least one photo for sale']);
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
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

  it('accepts a cover photo from this collection', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({ Item: photo });
    expect(bodyOf(await updateCollection(makeEvent({ coverPhotoId: PID }), 'c1')).coverPhotoId).toBe(PID);
  });
});

describe('deleteCollection', () => {
  it('returns 409 while photos remain', async () => {
    ddbMock.on(GetCommand, { TableName: COLLECTIONS }).resolves({ Item: collection });
    ddbMock.on(QueryCommand).resolves({ Items: [photo] });
    expect(asResult(await deleteCollection(makeEvent(), 'c1')).statusCode).toBe(409);
    expect(ddbMock).not.toHaveReceivedCommand(DeleteCommand);
  });

  it('deletes an empty collection', async () => {
    ddbMock.on(GetCommand, { TableName: COLLECTIONS }).resolves({ Item: { ...collection, photoCount: 0 } });
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    const res = await deleteCollection(makeEvent(), 'c1');
    expect(asResult(res).statusCode).toBe(200);
    expect(bodyOf(res)).toEqual({ deleted: true });
    expect(ddbMock).toHaveReceivedCommandWith(DeleteCommand, { TableName: COLLECTIONS, Key: { id: 'c1' } });
  });
});

describe('listCollectionPhotos', () => {
  it('returns all photos sorted by sortOrder', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [{ ...photo, id: 'b', sortOrder: 2 }, { ...photo, id: 'a', sortOrder: 1 }] });
    const res = await listCollectionPhotos(makeEvent(), 'c1');
    expect(bodyOf(res).photos.map((p: { id: string }) => p.id)).toEqual(['a', 'b']);
  });
});

describe('presignStorePhotos', () => {
  it('signs the original into the private bucket and previews into the media bucket', async () => {
    const res = await presignStorePhotos(makeEvent([{ id: PID, filename: 'a.png', contentType: 'image/png', bytes: 10 }]));
    const [item] = bodyOf(res);
    expect(item.originalKey).toBe(`originals/${PID}.png`);
    expect(item.originalUploadUrl).toBe(`https://signed.test/test-originals-bucket/originals/${PID}.png`);
    expect(item.previewUploadUrl).toMatch(new RegExp(`^https://signed.test/test-media-bucket/store/previews/${PID}-\\d+\\.jpg$`));
    expect(item.thumbUploadUrl).toMatch(new RegExp(`^https://signed.test/test-media-bucket/store/thumbs/${PID}-\\d+\\.jpg$`));
    expect(item.previewUrl).toMatch(new RegExp(`^https://media.test/store/previews/${PID}-\\d+\\.jpg$`));
  });

  it('rejects non-image content types', async () => {
    const res = await presignStorePhotos(makeEvent([{ id: PID, filename: 'a.gif', contentType: 'image/gif', bytes: 1 }]));
    expect(asResult(res).statusCode).toBe(400);
  });

  it('rejects ids that are not UUIDs (prevents writing to arbitrary keys)', async () => {
    const res = await presignStorePhotos(makeEvent([{ id: '../evil', filename: 'a.jpg', contentType: 'image/jpeg', bytes: 1 }]));
    expect(asResult(res).statusCode).toBe(400);
  });

  it('rejects empty and oversized batches', async () => {
    expect(asResult(await presignStorePhotos(makeEvent([]))).statusCode).toBe(400);
    const many = Array.from({ length: 51 }, () => ({ id: PID, filename: 'a.jpg', contentType: 'image/jpeg', bytes: 1 }));
    expect(asResult(await presignStorePhotos(makeEvent(many))).statusCode).toBe(400);
  });
});

describe('createStorePhotos', () => {
  const payload = {
    id: PID, collectionId: 'c1', originalKey: `originals/${PID}.jpg`, originalFilename: 'IMG_1.jpg',
    originalBytes: 1000, width: 6000, height: 4000, contentHash: 'h1',
    previewUrl: `https://media.test/store/previews/${PID}-100.jpg`,
    thumbnailUrl: `https://media.test/store/thumbs/${PID}-100.jpg`,
    photographerId: 'ph1', sortOrder: 3,
  };

  beforeEach(() => {
    ddbMock.on(GetCommand, { TableName: COLLECTIONS }).resolves({ Item: collection });
    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(UpdateCommand).resolves({});
    s3Mock.on(HeadObjectCommand).resolves({});
  });

  it('creates forSale photos and increments the collection photoCount', async () => {
    const res = asResult(await createStorePhotos(makeEvent([payload])));
    expect(res.statusCode).toBe(201);
    expect(ddbMock).toHaveReceivedCommandWith(PutCommand, {
      TableName: PHOTOS,
      Item: expect.objectContaining({ id: PID, status: 'forSale', priceOverrideCents: null, sortOrder: 3 }),
      ConditionExpression: 'attribute_not_exists(id)',
    });
    expect(ddbMock).toHaveReceivedCommandWith(UpdateCommand, {
      TableName: COLLECTIONS, Key: { id: 'c1' }, ExpressionAttributeValues: expect.objectContaining({ ':d': 1 }),
    });
  });

  it('returns 400 when the original was never uploaded', async () => {
    s3Mock.on(HeadObjectCommand).rejects(new Error('NotFound'));
    const res = await createStorePhotos(makeEvent([payload]));
    expect(asResult(res).statusCode).toBe(400);
    expect(bodyOf(res).error).toBe('The original for IMG_1.jpg was not uploaded');
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
  });

  it.each([
    ['original key for another photo', { originalKey: `originals/${PID2}.jpg` }],
    ['preview outside store/previews', { previewUrl: `https://media.test/photos/${PID}.jpg` }],
    ['preview on another domain', { previewUrl: `https://evil.test/store/previews/${PID}-1.jpg` }],
  ])('rejects %s', async (_label, override) => {
    expect(asResult(await createStorePhotos(makeEvent([{ ...payload, ...override }]))).statusCode).toBe(400);
  });

  it('rejects photos spanning multiple collections', async () => {
    const res = await createStorePhotos(makeEvent([payload, { ...payload, id: PID2, collectionId: 'c2' }]));
    expect(asResult(res).statusCode).toBe(400);
  });

  it('rejects an inactive photographer', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOGRAPHERS }).resolves({ Item: { ...activePhotographer, active: false } });
    expect(asResult(await createStorePhotos(makeEvent([payload]))).statusCode).toBe(400);
  });
});

describe('updateStorePhotos', () => {
  beforeEach(() => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({ Item: photo });
    ddbMock.on(UpdateCommand).resolves({});
  });

  it('updates fields and decrements photoCount when hiding a forSale photo', async () => {
    const res = await updateStorePhotos(makeEvent([{ id: PID, status: 'hidden', priceOverrideCents: 2500, sortOrder: 7 }]));
    expect(bodyOf(res)).toEqual({ updated: 1 });
    const photoUpdate = ddbMock.commandCalls(UpdateCommand).find((c) => c.args[0].input.TableName === PHOTOS)!;
    expect(photoUpdate.args[0].input.UpdateExpression).toBe('SET updatedAt = :now, sortOrder = :sort, priceOverrideCents = :price, #status = :status');
    expect(ddbMock).toHaveReceivedCommandWith(UpdateCommand, {
      TableName: COLLECTIONS, ExpressionAttributeValues: expect.objectContaining({ ':d': -1 }),
    });
  });

  it('does not touch photoCount when status is unchanged in effect', async () => {
    await updateStorePhotos(makeEvent([{ id: PID, status: 'forSale' }]));
    expect(ddbMock).not.toHaveReceivedCommandWith(UpdateCommand, { TableName: COLLECTIONS });
  });

  it('clears a price override with null', async () => {
    await updateStorePhotos(makeEvent([{ id: PID, priceOverrideCents: null }]));
    expect(ddbMock).toHaveReceivedCommandWith(UpdateCommand, {
      TableName: PHOTOS, ExpressionAttributeValues: expect.objectContaining({ ':price': null }),
    });
  });

  it.each([
    [{ id: PID, status: 'deleted' }],
    [{ id: PID, priceOverrideCents: 10 }],
    [{ id: PID, sortOrder: 'first' }],
  ])('rejects invalid update %p before writing anything', async (u) => {
    expect(asResult(await updateStorePhotos(makeEvent([u]))).statusCode).toBe(400);
    expect(ddbMock).not.toHaveReceivedCommand(UpdateCommand);
  });
});

describe('deleteStorePhotos', () => {
  it('deletes the original, preview, thumbnail and record, and decrements photoCount', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({});
    ddbMock.on(GetCommand, { TableName: PHOTOS, Key: { id: PID } }).resolves({ Item: photo });
    ddbMock.on(DeleteCommand).resolves({});
    ddbMock.on(UpdateCommand).resolves({});
    s3Mock.on(DeleteObjectCommand).resolves({});

    const res = await deleteStorePhotos(makeEvent({ ids: [PID, 'missing'] }));
    expect(bodyOf(res)).toEqual({ deleted: 1, skipped: [] });
    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: 'test-originals-bucket', Key: `originals/${PID}.jpg` });
    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: 'test-media-bucket', Key: `store/previews/${PID}-100.jpg` });
    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: 'test-media-bucket', Key: `store/thumbs/${PID}-100.jpg` });
    expect(ddbMock).toHaveReceivedCommandWith(UpdateCommand, {
      TableName: COLLECTIONS, ExpressionAttributeValues: expect.objectContaining({ ':d': -1 }),
    });
  });
});

describe('presignReplace / completeReplace', () => {
  beforeEach(() => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({ Item: photo });
    ddbMock.on(PutCommand).resolves({});
    s3Mock.on(HeadObjectCommand).resolves({});
    s3Mock.on(DeleteObjectCommand).resolves({});
  });

  it('presigns new URLs for an existing photo', async () => {
    const res = await presignReplace(makeEvent({ filename: 'new.jpg', contentType: 'image/jpeg', bytes: 5 }), PID);
    expect(bodyOf(res).originalKey).toBe(`originals/${PID}.jpg`);
  });

  it('returns 404 for an unknown photo', async () => {
    ddbMock.on(GetCommand, { TableName: PHOTOS }).resolves({});
    expect(asResult(await presignReplace(makeEvent({ contentType: 'image/jpeg' }), PID)).statusCode).toBe(404);
  });

  const complete = {
    originalKey: `originals/${PID}.png`, originalFilename: 'new.png', originalBytes: 2000, width: 3000, height: 2000,
    contentHash: 'h2',
    previewUrl: `https://media.test/store/previews/${PID}-200.jpg`,
    thumbnailUrl: `https://media.test/store/thumbs/${PID}-200.jpg`,
  };

  it('saves the new versions and deletes superseded objects (including the old original on ext change)', async () => {
    const res = await completeReplace(makeEvent(complete), PID);
    expect(bodyOf(res)).toMatchObject({ originalKey: `originals/${PID}.png`, contentHash: 'h2', status: 'forSale' });
    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: 'test-media-bucket', Key: `store/previews/${PID}-100.jpg` });
    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: 'test-media-bucket', Key: `store/thumbs/${PID}-100.jpg` });
    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: 'test-originals-bucket', Key: `originals/${PID}.jpg` });
  });

  it('keeps the original when the key is unchanged (overwritten in place)', async () => {
    await completeReplace(makeEvent({ ...complete, originalKey: `originals/${PID}.jpg` }), PID);
    expect(s3Mock).not.toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: 'test-originals-bucket' });
  });

  it('rejects when the new original was not uploaded', async () => {
    s3Mock.on(HeadObjectCommand).rejects(new Error('NotFound'));
    expect(asResult(await completeReplace(makeEvent(complete), PID)).statusCode).toBe(400);
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
  });
});
