import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const EVENTS_TABLE = process.env.EVENTS_TABLE!;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function ok(body: object): APIGatewayProxyResultV2 {
  return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

function errResponse(status: number, message: string): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

async function listEvents(): Promise<APIGatewayProxyResultV2> {
  const result = await ddb.send(new QueryCommand({
    TableName: EVENTS_TABLE,
    IndexName: 'byDate',
    KeyConditionExpression: 'entity = :e',
    FilterExpression: 'attribute_not_exists(goLiveAt) OR goLiveAt <= :now',
    ExpressionAttributeValues: {
      ':e': 'EVENT',
      ':now': new Date().toISOString(),
    },
    ScanIndexForward: false, // newest first
  }));
  return ok(result.Items ?? []);
}

async function getEvent(id: string): Promise<APIGatewayProxyResultV2> {
  const result = await ddb.send(new GetCommand({
    TableName: EVENTS_TABLE,
    Key: { id },
  }));
  if (!result.Item) return errResponse(404, 'Event not found');
  return ok(result.Item);
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;

    if (method === 'GET' && path === '/api/events') return listEvents();

    const match = path.match(/^\/api\/events\/([^/]+)$/);
    if (method === 'GET' && match) return getEvent(match[1]);

    return errResponse(404, 'Not found');
  } catch (e) {
    console.error('Events handler error:', e);
    return errResponse(500, 'Internal server error');
  }
};
