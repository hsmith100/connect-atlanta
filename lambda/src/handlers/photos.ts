import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type {
  PresignRequest,
  PhotoCreatePayload,
  PhotoUpdatePayload,
} from '../../../shared/types/photos';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const sm = new SecretsManagerClient({});

const PHOTOS_TABLE = process.env.PHOTOS_TABLE!;
const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const MEDIA_BUCKET = process.env.MEDIA_BUCKET!;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN!;
const ADMIN_SECRET_ARN = process.env.ADMIN_SECRET_ARN!;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

// Cached admin key — fetched from Secrets Manager on first admin request per cold start
let cachedAdminKey: string | null = null;

function ok(body: object): APIGatewayProxyResultV2 {
  return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

function errResponse(status: number, message: string): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

async function requireAdmin(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2 | null> {
  if (!cachedAdminKey) {
    const r = await sm.send(new GetSecretValueCommand({ SecretId: ADMIN_SECRET_ARN }));
    cachedAdminKey = r.SecretString!;
  }
  const key = event.headers['x-admin-key'];
  return key === cachedAdminKey ? null : errResponse(401, 'Unauthorized');
}

function mediaUrl(key: string): string {
  return `https://${CLOUDFRONT_DOMAIN}/${key}`;
}

// ── Public ───────────────────────────────────────────────────────────────────

async function getGallery(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const eventId = event.queryStringParameters?.eventId;

  const result = await ddb.send(new QueryCommand({
    TableName: PHOTOS_TABLE,
    IndexName: 'byOrder',
    KeyConditionExpression: 'entity = :e',
    FilterExpression: eventId
      ? 'visible = :v AND eventId = :eid'
      : 'visible = :v',
    ExpressionAttributeValues: {
      ':e': 'PHOTO',
      ':v': true,
      ...(eventId ? { ':eid': eventId } : {}),
    },
    ScanIndexForward: true,
  }));

  return ok({ photos: result.Items ?? [] });
}

// ── Admin ────────────────────────────────────────────────────────────────────

async function listAllPhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const result = await ddb.send(new QueryCommand({
    TableName: PHOTOS_TABLE,
    IndexName: 'byOrder',
    KeyConditionExpression: 'entity = :e',
    ExpressionAttributeValues: { ':e': 'PHOTO' },
    ScanIndexForward: true,
  }));

  return ok({ photos: result.Items ?? [] });
}

async function presignUpload(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const requests: PresignRequest[] = JSON.parse(event.body ?? '[]');

  const results = await Promise.all(requests.map(async (req) => {
    const ext = req.filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const photoKey = `photos/${req.id}.${ext}`;
    const thumbKey = `photos/thumbs/${req.id}.${ext}`;

    const [uploadUrl, thumbUploadUrl] = await Promise.all([
      getSignedUrl(s3, new PutObjectCommand({
        Bucket: MEDIA_BUCKET,
        Key: photoKey,
        ContentType: req.contentType,
      }), { expiresIn: 300 }),
      getSignedUrl(s3, new PutObjectCommand({
        Bucket: MEDIA_BUCKET,
        Key: thumbKey,
        ContentType: req.contentType,
      }), { expiresIn: 300 }),
    ]);

    return {
      id: req.id,
      uploadUrl,
      thumbUploadUrl,
      url: mediaUrl(photoKey),
      thumbnailUrl: mediaUrl(thumbKey),
    };
  }));

  return ok(results);
}

async function createPhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const photos: PhotoCreatePayload[] = JSON.parse(event.body ?? '[]');
  const now = new Date().toISOString();

  for (const photo of photos) {
    await ddb.send(new PutCommand({
      TableName: PHOTOS_TABLE,
      Item: {
        id: photo.id,
        entity: 'PHOTO',
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        eventId: photo.eventId ?? null,
        sortOrder: photo.sortOrder,
        visible: true,
        createdAt: now,
      },
    }));
  }

  return ok({ created: photos.length });
}

async function updatePhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const updates: PhotoUpdatePayload[] = JSON.parse(event.body ?? '[]');

  for (const update of updates) {
    const setParts: string[] = [];
    const values: Record<string, string | number | boolean> = {};

    if (update.visible !== undefined) {
      setParts.push('visible = :v');
      values[':v'] = update.visible;
    }
    if (update.sortOrder !== undefined) {
      setParts.push('sortOrder = :s');
      values[':s'] = update.sortOrder;
    }

    if (setParts.length === 0) continue;

    await ddb.send(new UpdateCommand({
      TableName: PHOTOS_TABLE,
      Key: { id: update.id },
      UpdateExpression: `SET ${setParts.join(', ')}`,
      ExpressionAttributeValues: values,
    }));
  }

  return ok({ updated: updates.length });
}

async function deletePhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const { ids }: { ids: string[] } = JSON.parse(event.body ?? '{"ids":[]}');

  for (const id of ids) {
    const record = await ddb.send(new GetCommand({
      TableName: PHOTOS_TABLE,
      Key: { id },
    }));

    if (record.Item) {
      // Extract S3 key from full CloudFront URL: https://domain/photos/id.ext → photos/id.ext
      const photoKey = (record.Item.url as string).replace(/^https?:\/\/[^/]+\//, '');
      const thumbKey = (record.Item.thumbnailUrl as string).replace(/^https?:\/\/[^/]+\//, '');

      await Promise.all([
        s3.send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: photoKey })),
        s3.send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: thumbKey })),
        ddb.send(new DeleteCommand({ TableName: PHOTOS_TABLE, Key: { id } })),
      ]);
    }
  }

  return ok({ deleted: ids.length });
}

// ── Admin: events CRUD ───────────────────────────────────────────────────────

async function listAdminEvents(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const result = await ddb.send(new QueryCommand({
    TableName: EVENTS_TABLE,
    IndexName: 'byDate',
    KeyConditionExpression: 'entity = :e',
    ExpressionAttributeValues: { ':e': 'EVENT' },
    ScanIndexForward: false,
  }));

  return ok(result.Items ?? []);
}

async function createEvent(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body: {
    id: string;
    title: string;
    date: string;
    time?: string;
    location?: string;
    goLiveAt?: string;
    ticketingUrl?: string;
  } = JSON.parse(event.body ?? '{}');

  if (!body.id || !body.title || !body.date) {
    return errResponse(400, 'id, title, and date are required');
  }

  await ddb.send(new PutCommand({
    TableName: EVENTS_TABLE,
    Item: {
      id: body.id,
      entity: 'EVENT',
      title: body.title,
      date: body.date,
      ...(body.time ? { time: body.time } : {}),
      ...(body.location ? { location: body.location } : {}),
      ...(body.goLiveAt ? { goLiveAt: body.goLiveAt } : {}),
      ...(body.ticketingUrl ? { ticketingUrl: body.ticketingUrl } : {}),
    },
    ConditionExpression: 'attribute_not_exists(id)',
  }));

  return ok({ created: true });
}

// ── Admin: flyer management ───────────────────────────────────────────────────

async function presignFlyer(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const { eventId, filename, contentType }: { eventId: string; filename: string; contentType: string } =
    JSON.parse(event.body ?? '{}');

  if (!eventId || !filename || !contentType) {
    return errResponse(400, 'eventId, filename, and contentType are required');
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  // Key uses eventId so re-uploading replaces the previous flyer
  const flyerKey = `flyers/${eventId}.${ext}`;

  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: MEDIA_BUCKET,
    Key: flyerKey,
    ContentType: contentType,
  }), { expiresIn: 300 });

  return ok({ uploadUrl, flyerUrl: mediaUrl(flyerKey) });
}

async function updateEventFlyer(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const id = event.pathParameters?.id;
  if (!id) return errResponse(400, 'Missing event id');

  const body: { flyerUrl?: string; goLiveAt?: string | null; ticketingUrl?: string | null } = JSON.parse(event.body ?? '{}');
  if (!body.flyerUrl && body.goLiveAt === undefined && body.ticketingUrl === undefined) {
    return errResponse(400, 'flyerUrl, goLiveAt, or ticketingUrl is required');
  }

  const setParts: string[] = [];
  const removeParts: string[] = [];
  const values: Record<string, string> = {};

  if (body.flyerUrl) {
    setParts.push('flyerUrl = :url');
    values[':url'] = body.flyerUrl;
  }
  if (body.goLiveAt !== undefined) {
    if (body.goLiveAt === null) {
      removeParts.push('goLiveAt');
    } else {
      setParts.push('goLiveAt = :gla');
      values[':gla'] = body.goLiveAt;
    }
  }
  if (body.ticketingUrl !== undefined) {
    if (body.ticketingUrl === null) {
      removeParts.push('ticketingUrl');
    } else {
      setParts.push('ticketingUrl = :tu');
      values[':tu'] = body.ticketingUrl;
    }
  }

  const parts: string[] = [];
  if (setParts.length > 0) parts.push(`SET ${setParts.join(', ')}`);
  if (removeParts.length > 0) parts.push(`REMOVE ${removeParts.join(', ')}`);

  await ddb.send(new UpdateCommand({
    TableName: EVENTS_TABLE,
    Key: { id },
    UpdateExpression: parts.join(' '),
    ...(Object.keys(values).length > 0 ? { ExpressionAttributeValues: values } : {}),
  }));

  return ok({ updated: true });
}

// ── Router ───────────────────────────────────────────────────────────────────

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;

    if (method === 'GET' && path === '/api/gallery') return getGallery(event);
    if (method === 'GET' && path === '/api/admin/photos') return listAllPhotos(event);
    if (method === 'POST' && path === '/api/admin/photos/presign') return presignUpload(event);
    if (method === 'POST' && path === '/api/admin/photos') return createPhotos(event);
    if (method === 'PATCH' && path === '/api/admin/photos') return updatePhotos(event);
    if (method === 'DELETE' && path === '/api/admin/photos') return deletePhotos(event);
    if (method === 'GET' && path === '/api/admin/events') return listAdminEvents(event);
    if (method === 'POST' && path === '/api/admin/events') return createEvent(event);
    if (method === 'POST' && path === '/api/admin/flyers/presign') return presignFlyer(event);
    const flyerMatch = path.match(/^\/api\/admin\/events\/([^/]+)$/);
    if (method === 'PATCH' && flyerMatch) return updateEventFlyer(event);

    return errResponse(404, 'Not found');
  } catch (e) {
    console.error('Photos handler error:', e);
    return errResponse(500, 'Internal server error');
  }
};
