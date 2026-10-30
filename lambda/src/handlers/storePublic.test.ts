import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { listPublicCollections, getPublicCollectionPage } from './storePublic';

const ddbMock = mockClient(DynamoDBDocumentClient);
const asResult = (r: unknown) => r as APIGatewayProxyStructuredResultV2;
const bodyOf = (r: unknown) => JSON.parse(asResult(r).body as string);

const COLLECTIONS = 'test-photo-collections';

function collection(id: string, extra: Record<string, unknown> = {}) {
  return {
    id, entity: 'COLLECTION', eventId: `e-${id}`, title: `Title ${id}`, eventDate: '2026-08-15', status: 'published',
    defaultPriceCents: 1500, coverPhotoId: null, forSaleCount: 2, photoCount: 3, ...extra,
  };
}
function photo(id: string, sortOrder: number, extra: Record<string, unknown> = {}) {
  return {
    id, collectionId: 'c1', sortOrder, forSale: true, removed: false, inGallery: false,
    thumbnailUrl: `https://m/library/thumbs/${id}.jpg`, previewUrl: `https://m/library/previews/${id}.jpg`,
    webUrl: `https://m/library/web/${id}.jpg`, originalKey: `originals/${id}.jpg`, width: 6000, height: 4000,
    photographerId: 'ph1', priceOverrideCents: null, ...extra,
  };
}
function pageEvent(cursor?: string): APIGatewayProxyEventV2 {
  return { queryStringParameters: cursor ? { cursor } : undefined } as unknown as APIGatewayProxyEventV2;
}

beforeEach(() => {
  ddbMock.reset();
  ddbMock.on(ScanCommand).resolves({ Items: [{ id: 'ph1', name: 'Jay Ortiz' }, { id: 'ph2', name: 'Maria' }] });
});

describe('listPublicCollections', () => {
  it('lists published collections that have photos for sale, with cover, count and credits', async () => {
    ddbMock.on(QueryCommand, { IndexName: 'byEventDate' }).resolves({ Items: [
      collection('c1', { coverPhotoId: 'b' }), collection('draft', { status: 'draft' }), collection('empty'),
    ] });
    ddbMock.on(QueryCommand, { IndexName: 'byCollection', ExpressionAttributeValues: { ':c': 'c1', ':t': true, ':f': false } })
      .resolves({ Items: [photo('b', 20, { photographerId: 'ph2' }), photo('a', 10), photo('c', 30)] });
    ddbMock.on(QueryCommand, { IndexName: 'byCollection', ExpressionAttributeValues: { ':c': 'empty', ':t': true, ':f': false } })
      .resolves({ Items: [] });

    const { collections } = bodyOf(await listPublicCollections());
    expect(collections).toEqual([{
      id: 'c1', eventId: 'e-c1', title: 'Title c1', eventDate: '2026-08-15',
      coverThumbnailUrl: 'https://m/library/thumbs/b.jpg', photoCount: 3, photographerNames: ['Jay Ortiz', 'Maria'],
    }]);
    expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, { IndexName: 'byEventDate', ScanIndexForward: false });
    expect(ddbMock).not.toHaveReceivedCommandWith(QueryCommand, { ExpressionAttributeValues: { ':c': 'draft', ':t': true, ':f': false } });
  });

  it('falls back to the first photo by sortOrder when there is no cover', async () => {
    ddbMock.on(QueryCommand, { IndexName: 'byEventDate' }).resolves({ Items: [collection('c1')] });
    ddbMock.on(QueryCommand, { IndexName: 'byCollection' }).resolves({ Items: [photo('z', 50), photo('y', 5)] });
    expect(bodyOf(await listPublicCollections()).collections[0].coverThumbnailUrl).toBe('https://m/library/thumbs/y.jpg');
  });
});

describe('getPublicCollectionPage', () => {
  beforeEach(() => {
    ddbMock.on(GetCommand, { TableName: COLLECTIONS }).resolves({ Item: collection('c1') });
  });

  it('returns for-sale photos with effective price and photographer, and no private fields', async () => {
    ddbMock.on(QueryCommand, { IndexName: 'byCollection' }).resolves({ Items: [photo('a', 10), photo('b', 20, { priceOverrideCents: 2500, photographerId: 'ph2' })] });
    const res = await getPublicCollectionPage(pageEvent(), 'c1');
    const body = bodyOf(res);
    expect(body.collection).toEqual({ id: 'c1', title: 'Title c1', eventDate: '2026-08-15', photoCount: 2 });
    expect(body.photos).toEqual([
      { id: 'a', thumbnailUrl: 'https://m/library/thumbs/a.jpg', previewUrl: 'https://m/library/previews/a.jpg', width: 6000, height: 4000, priceCents: 1500, photographerName: 'Jay Ortiz' },
      { id: 'b', thumbnailUrl: 'https://m/library/thumbs/b.jpg', previewUrl: 'https://m/library/previews/b.jpg', width: 6000, height: 4000, priceCents: 2500, photographerName: 'Maria' },
    ]);
    expect(body.nextCursor).toBeNull();
    const raw = asResult(res).body as string;
    expect(raw).not.toContain('originals/');
    expect(raw).not.toContain('library/web/');
    expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, { FilterExpression: 'forSale = :t AND removed = :f' });
  });

  it.each([
    ['missing', undefined],
    ['draft', collection('c1', { status: 'draft' })],
  ])('returns 404 for a %s collection', async (_label, item) => {
    ddbMock.on(GetCommand, { TableName: COLLECTIONS }).resolves({ Item: item });
    const res = await getPublicCollectionPage(pageEvent(), 'c1');
    expect(asResult(res).statusCode).toBe(404);
    expect(bodyOf(res).error).toBe("This photo collection isn't available.");
  });

  it('fills a page of 60 across batches and returns a cursor at the last photo returned', async () => {
    const batch1 = Array.from({ length: 40 }, (_, i) => photo(`p${i}`, i));
    const batch2 = Array.from({ length: 40 }, (_, i) => photo(`p${40 + i}`, 40 + i));
    ddbMock.on(QueryCommand, { IndexName: 'byCollection' })
      .resolvesOnce({ Items: batch1, LastEvaluatedKey: { id: 'p39', collectionId: 'c1', sortOrder: 39 } })
      .resolvesOnce({ Items: batch2, LastEvaluatedKey: { id: 'p79', collectionId: 'c1', sortOrder: 79 } });
    const body = bodyOf(await getPublicCollectionPage(pageEvent(), 'c1'));
    expect(body.photos).toHaveLength(60);
    expect(body.photos[59].id).toBe('p59');
    const cursor = JSON.parse(Buffer.from(body.nextCursor, 'base64url').toString());
    expect(cursor).toEqual({ id: 'p59', collectionId: 'c1', sortOrder: 59 });
  });

  it('continues from a cursor', async () => {
    const cursor = Buffer.from(JSON.stringify({ id: 'p59', collectionId: 'c1', sortOrder: 59 })).toString('base64url');
    ddbMock.on(QueryCommand, { IndexName: 'byCollection' }).resolves({ Items: [photo('p60', 60)] });
    const body = bodyOf(await getPublicCollectionPage(pageEvent(cursor), 'c1'));
    expect(body.photos.map((p: { id: string }) => p.id)).toEqual(['p60']);
    expect(body.nextCursor).toBeNull();
    expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, { ExclusiveStartKey: { id: 'p59', collectionId: 'c1', sortOrder: 59 } });
  });

  it.each([
    ['garbage', 'not-base64-json'],
    ['another collection', Buffer.from(JSON.stringify({ id: 'x', collectionId: 'other', sortOrder: 1 })).toString('base64url')],
  ])('rejects a %s cursor', async (_label, cursor) => {
    expect(asResult(await getPublicCollectionPage(pageEvent(cursor), 'c1')).statusCode).toBe(400);
  });

  it('returns no cursor when exactly one page remains', async () => {
    ddbMock.on(QueryCommand, { IndexName: 'byCollection' }).resolves({ Items: Array.from({ length: 60 }, (_, i) => photo(`p${i}`, i)) });
    expect(bodyOf(await getPublicCollectionPage(pageEvent(), 'c1')).nextCursor).toBeNull();
  });
});
