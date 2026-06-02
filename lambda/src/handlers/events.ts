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

const YOUTUBE_PLAYLIST_ID = 'PLbkf2yT5-y0dvsy8NsvQ7EFY7n2_niejH';

async function getLatestYouTubeVideo(): Promise<APIGatewayProxyResultV2> {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${YOUTUBE_PLAYLIST_ID}`);
  if (!res.ok) return errResponse(502, 'Failed to fetch YouTube feed');
  const xml = await res.text();
  const match = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  if (!match) return errResponse(404, 'No videos found in playlist');
  return ok({ videoId: match[1] });
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;

    if (method === 'GET' && path === '/api/events') return await listEvents();
    if (method === 'GET' && path === '/api/youtube/latest-video') return await getLatestYouTubeVideo();

    const match = path.match(/^\/api\/events\/([^/]+)$/);
    if (method === 'GET' && match) return await getEvent(match[1]);

    return errResponse(404, 'Not found');
  } catch (e) {
    console.error('Events handler error:', e);
    return errResponse(500, 'Internal server error');
  }
};
