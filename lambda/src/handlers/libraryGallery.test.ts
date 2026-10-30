import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { getPublicGallery } from './libraryGallery';

const ddbMock = mockClient(DynamoDBDocumentClient);
const bodyOf = (r: unknown) => JSON.parse((r as APIGatewayProxyStructuredResultV2).body as string);

function makeEvent(eventId?: string): APIGatewayProxyEventV2 {
  return { queryStringParameters: eventId ? { eventId } : undefined } as unknown as APIGatewayProxyEventV2;
}

const collections = [
  { id: 'c1', entity: 'COLLECTION', eventId: 'e1' },
  { id: 'c2', entity: 'COLLECTION', eventId: 'e2' },
];
function photo(id: string, collectionId: string, gallerySortOrder: number) {
  return {
    id, collectionId, gallerySortOrder, inGallery: true, removed: false, galleryKey: 'GALLERY',
    webUrl: `https://m/library/web/${id}.jpg`, webThumbUrl: `https://m/library/web-thumbs/${id}.jpg`,
    previewUrl: `https://m/library/previews/${id}.jpg`, originalKey: `originals/${id}.jpg`,
    createdAt: '2026-10-01T00:00:00.000Z',
  };
}

beforeEach(() => {
  ddbMock.reset();
  ddbMock.on(QueryCommand, { IndexName: 'byEventDate' }).resolves({ Items: collections });
});

describe('getPublicGallery', () => {
  it('returns gallery photos in order, in the legacy response shape', async () => {
    ddbMock.on(QueryCommand, { IndexName: 'byGallery' }).resolves({ Items: [photo('a', 'c1', 10), photo('b', 'c2', 20)] });
    const { photos } = bodyOf(await getPublicGallery(makeEvent()));
    expect(photos).toEqual([
      { id: 'a', entity: 'PHOTO', url: 'https://m/library/web/a.jpg', thumbnailUrl: 'https://m/library/web-thumbs/a.jpg', eventId: 'e1', sortOrder: 10, visible: true, createdAt: '2026-10-01T00:00:00.000Z' },
      { id: 'b', entity: 'PHOTO', url: 'https://m/library/web/b.jpg', thumbnailUrl: 'https://m/library/web-thumbs/b.jpg', eventId: 'e2', sortOrder: 20, visible: true, createdAt: '2026-10-01T00:00:00.000Z' },
    ]);
    expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, { IndexName: 'byGallery', KeyConditionExpression: 'galleryKey = :g' });
  });

  it('never exposes the original or the watermarked preview', async () => {
    ddbMock.on(QueryCommand, { IndexName: 'byGallery' }).resolves({ Items: [photo('a', 'c1', 10)] });
    const body = JSON.stringify(bodyOf(await getPublicGallery(makeEvent())));
    expect(body).not.toContain('originals/');
    expect(body).not.toContain('previews/');
  });

  it('reads all pages of the gallery index', async () => {
    ddbMock.on(QueryCommand, { IndexName: 'byGallery' })
      .resolvesOnce({ Items: [photo('a', 'c1', 10)], LastEvaluatedKey: { id: 'a' } })
      .resolvesOnce({ Items: [photo('b', 'c1', 20)] });
    expect(bodyOf(await getPublicGallery(makeEvent())).photos.map((p: { id: string }) => p.id)).toEqual(['a', 'b']);
  });

  it('returns an empty gallery', async () => {
    ddbMock.on(QueryCommand, { IndexName: 'byGallery' }).resolves({ Items: [] });
    expect(bodyOf(await getPublicGallery(makeEvent()))).toEqual({ photos: [] });
  });

  describe('?eventId=', () => {
    it("returns only that event's gallery photos, in gallery order", async () => {
      ddbMock.on(QueryCommand, { IndexName: 'byCollection' }).resolves({ Items: [photo('y', 'c2', 30), photo('x', 'c2', 5)] });
      const { photos } = bodyOf(await getPublicGallery(makeEvent('e2')));
      expect(photos.map((p: { id: string; eventId: string }) => [p.id, p.eventId])).toEqual([['x', 'e2'], ['y', 'e2']]);
      expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, {
        IndexName: 'byCollection',
        FilterExpression: 'inGallery = :t AND removed = :f',
        ExpressionAttributeValues: { ':c': 'c2', ':t': true, ':f': false },
      });
      expect(ddbMock).not.toHaveReceivedCommandWith(QueryCommand, { IndexName: 'byGallery' });
    });

    it('returns an empty list for an event without a collection', async () => {
      expect(bodyOf(await getPublicGallery(makeEvent('no-such-event')))).toEqual({ photos: [] });
      expect(ddbMock).not.toHaveReceivedCommandWith(QueryCommand, { IndexName: 'byCollection' });
    });
  });
});
