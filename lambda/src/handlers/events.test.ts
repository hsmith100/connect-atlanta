import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from './events';

// events.ts uses a private ddb — mock at the class level
const ddbMock = mockClient(DynamoDBDocumentClient);

const asResult = (r: unknown) => r as APIGatewayProxyStructuredResultV2;

function makeEvent(method: string, path: string): APIGatewayProxyEventV2 {
  return {
    requestContext: { http: { method } },
    rawPath: path,
    queryStringParameters: {},
  } as unknown as APIGatewayProxyEventV2;
}

beforeEach(() => {
  ddbMock.reset();
});

// ── GET /api/events ───────────────────────────────────────────────────────────

describe('GET /api/events', () => {
  it('returns event list from DynamoDB', async () => {
    const items = [{ id: 'e1', title: 'Event 1' }, { id: 'e2', title: 'Event 2' }];
    ddbMock.on(QueryCommand).resolves({ Items: items });
    const result = asResult(await handler(makeEvent('GET', '/api/events')));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual(items);
  });

  it('returns empty array when DynamoDB returns no items', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: undefined });
    const result = asResult(await handler(makeEvent('GET', '/api/events')));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual([]);
  });

  it('queries the byDate index', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    await handler(makeEvent('GET', '/api/events'));
    expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, {
      TableName: process.env.EVENTS_TABLE,
      IndexName: 'byDate',
    });
  });
});

// ── GET /api/events/:id ───────────────────────────────────────────────────────

describe('GET /api/events/:id', () => {
  it('returns the event when found', async () => {
    const item = { id: 'e1', title: 'Event 1' };
    ddbMock.on(GetCommand).resolves({ Item: item });
    const result = asResult(await handler(makeEvent('GET', '/api/events/e1')));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual(item);
  });

  it('returns 404 when event is not found', async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });
    const result = asResult(await handler(makeEvent('GET', '/api/events/missing')));
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body as string)).toEqual({ error: 'Event not found' });
  });

  it('fetches by the id from the path', async () => {
    ddbMock.on(GetCommand).resolves({ Item: { id: 'abc-123' } });
    await handler(makeEvent('GET', '/api/events/abc-123'));
    expect(ddbMock).toHaveReceivedCommandWith(GetCommand, {
      TableName: process.env.EVENTS_TABLE,
      Key: { id: 'abc-123' },
    });
  });
});

// ── unknown routes ────────────────────────────────────────────────────────────

describe('unknown routes', () => {
  it('returns 404 for an unknown path', async () => {
    const result = asResult(await handler(makeEvent('GET', '/api/unknown')));
    expect(result.statusCode).toBe(404);
  });

  it('returns 404 for POST /api/events (unsupported method)', async () => {
    const result = asResult(await handler(makeEvent('POST', '/api/events')));
    expect(result.statusCode).toBe(404);
  });
});

// ── error handling ────────────────────────────────────────────────────────────

describe('error handling', () => {
  it('returns 500 when DynamoDB throws', async () => {
    ddbMock.on(QueryCommand).rejects(new Error('DDB connection error'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = asResult(await handler(makeEvent('GET', '/api/events')));
    expect(result.statusCode).toBe(500);
    jest.restoreAllMocks();
  });
});
