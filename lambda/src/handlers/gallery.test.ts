import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { getGallery } from './gallery';

const ddbMock = mockClient(DynamoDBDocumentClient);
const asResult = (r: unknown) => r as APIGatewayProxyStructuredResultV2;

function makeEvent(params?: Record<string, string>): APIGatewayProxyEventV2 {
  return { queryStringParameters: params } as unknown as APIGatewayProxyEventV2;
}

beforeEach(() => {
  ddbMock.reset();
});

// ── getGallery ────────────────────────────────────────────────────────────────

describe('getGallery', () => {
  it('returns visible photos', async () => {
    const photos = [{ id: 'p1', url: 'https://media.test/photos/p1.jpg' }];
    ddbMock.on(QueryCommand).resolves({ Items: photos });
    const result = asResult(await getGallery(makeEvent()));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({ photos });
  });

  it('returns empty array when no photos', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: undefined });
    const result = asResult(await getGallery(makeEvent()));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({ photos: [] });
  });

  it('queries the byOrder index with visible filter when no eventId', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    await getGallery(makeEvent());
    expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, {
      TableName: process.env.PHOTOS_TABLE,
      IndexName: 'byOrder',
      FilterExpression: 'visible = :v',
      ExpressionAttributeValues: expect.objectContaining({ ':v': true }),
    });
  });

  it('adds eventId filter when eventId param is provided', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    await getGallery(makeEvent({ eventId: 'ev-123' }));
    expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, {
      FilterExpression: 'visible = :v AND eventId = :eid',
      ExpressionAttributeValues: expect.objectContaining({ ':eid': 'ev-123', ':v': true }),
    });
  });
});
