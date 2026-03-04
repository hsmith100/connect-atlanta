import {
  QueryCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ddb, s3, EVENTS_TABLE, MEDIA_BUCKET, ok, errResponse, requireAdmin, mediaUrl } from '../lib/photoShared';

export async function listAdminEvents(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
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

export async function createEvent(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body: {
    id: string;
    title: string;
    date: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    flyerUrl?: string;
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
      ...(body.startTime ? { startTime: body.startTime } : {}),
      ...(body.endTime ? { endTime: body.endTime } : {}),
      ...(body.location ? { location: body.location } : {}),
      ...(body.flyerUrl ? { flyerUrl: body.flyerUrl } : {}),
      ...(body.goLiveAt ? { goLiveAt: body.goLiveAt } : {}),
      ...(body.ticketingUrl ? { ticketingUrl: body.ticketingUrl } : {}),
    },
    ConditionExpression: 'attribute_not_exists(id)',
  }));

  return ok({ created: true });
}

export async function presignFlyer(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const { eventId, filename, contentType }: { eventId: string; filename: string; contentType: string } =
    JSON.parse(event.body ?? '{}');

  if (!eventId || !filename || !contentType) {
    return errResponse(400, 'eventId, filename, and contentType are required');
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  // Include timestamp so each upload gets a unique URL (avoids CloudFront cache serving old flyer)
  const flyerKey = `flyers/${eventId}-${Date.now()}.${ext}`;

  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: MEDIA_BUCKET,
    Key: flyerKey,
    ContentType: contentType,
  }), { expiresIn: 300 });

  return ok({ uploadUrl, flyerUrl: mediaUrl(flyerKey) });
}

export async function updateEventFlyer(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
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
    // Delete the old flyer from S3 before storing the new URL
    const oldRecord = await ddb.send(new GetCommand({ TableName: EVENTS_TABLE, Key: { id } }));
    if (oldRecord.Item?.flyerUrl) {
      const oldKey = (oldRecord.Item.flyerUrl as string).replace(/^https?:\/\/[^/]+\//, '');
      await s3.send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: oldKey }));
    }
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

export async function deleteEventById(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const id = event.pathParameters?.id;
  if (!id) return errResponse(400, 'Missing event id');

  const record = await ddb.send(new GetCommand({ TableName: EVENTS_TABLE, Key: { id } }));

  if (record.Item?.flyerUrl) {
    const flyerKey = (record.Item.flyerUrl as string).replace(/^https?:\/\/[^/]+\//, '');
    await s3.send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: flyerKey }));
  }

  await ddb.send(new DeleteCommand({ TableName: EVENTS_TABLE, Key: { id } }));

  return ok({ deleted: true });
}
