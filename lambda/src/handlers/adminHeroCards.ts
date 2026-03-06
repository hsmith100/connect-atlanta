import {
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ddb, s3, MEDIA_BUCKET, ok, errResponse, requireAdmin, mediaUrl } from '../lib/photoShared';

const HERO_CARDS_TABLE = process.env.HERO_CARDS_TABLE!;

export async function listHeroCards(_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const result = await ddb.send(new QueryCommand({
    TableName: HERO_CARDS_TABLE,
    IndexName: 'byOrder',
    KeyConditionExpression: 'entity = :e',
    ExpressionAttributeValues: { ':e': 'CARD' },
    ScanIndexForward: true,
  }));

  const cards = (result.Items ?? []).filter((c) => c.visible);
  return ok(cards);
}

export async function listAdminHeroCards(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const result = await ddb.send(new QueryCommand({
    TableName: HERO_CARDS_TABLE,
    IndexName: 'byOrder',
    KeyConditionExpression: 'entity = :e',
    ExpressionAttributeValues: { ':e': 'CARD' },
    ScanIndexForward: true,
  }));

  return ok(result.Items ?? []);
}

export async function createHeroCard(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body: {
    id: string;
    title: string;
    description: string;
    ctaText: string;
    linkUrl: string;
    imageUrl?: string;
    icon?: string;
    sortOrder: number;
    visible: boolean;
  } = JSON.parse(event.body ?? '{}');

  if (!body.id || !body.title || !body.description || !body.ctaText || !body.linkUrl) {
    return errResponse(400, 'id, title, description, ctaText, and linkUrl are required');
  }

  await ddb.send(new PutCommand({
    TableName: HERO_CARDS_TABLE,
    Item: {
      id: body.id,
      entity: 'CARD',
      title: body.title,
      description: body.description,
      ctaText: body.ctaText,
      linkUrl: body.linkUrl,
      sortOrder: body.sortOrder ?? 0,
      visible: body.visible ?? true,
      ...(body.imageUrl ? { imageUrl: body.imageUrl } : {}),
      ...(body.icon ? { icon: body.icon } : {}),
    },
    ConditionExpression: 'attribute_not_exists(id)',
  }));

  return ok({ created: true });
}

export async function updateHeroCard(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const id = event.pathParameters?.id;
  if (!id) return errResponse(400, 'Missing card id');

  const body: {
    title?: string;
    description?: string;
    ctaText?: string;
    linkUrl?: string;
    imageUrl?: string | null;
    icon?: string | null;
    sortOrder?: number;
    visible?: boolean;
  } = JSON.parse(event.body ?? '{}');

  const setParts: string[] = [];
  const removeParts: string[] = [];
  const values: Record<string, unknown> = {};

  if (body.title !== undefined) { setParts.push('title = :title'); values[':title'] = body.title; }
  if (body.description !== undefined) { setParts.push('description = :desc'); values[':desc'] = body.description; }
  if (body.ctaText !== undefined) { setParts.push('ctaText = :cta'); values[':cta'] = body.ctaText; }
  if (body.linkUrl !== undefined) { setParts.push('linkUrl = :url'); values[':url'] = body.linkUrl; }
  if (body.sortOrder !== undefined) { setParts.push('sortOrder = :so'); values[':so'] = body.sortOrder; }
  if (body.visible !== undefined) { setParts.push('visible = :vis'); values[':vis'] = body.visible; }
  if (body.imageUrl !== undefined) {
    if (body.imageUrl === null) removeParts.push('imageUrl');
    else { setParts.push('imageUrl = :img'); values[':img'] = body.imageUrl; }
  }
  if (body.icon !== undefined) {
    if (body.icon === null) removeParts.push('icon');
    else { setParts.push('icon = :icon'); values[':icon'] = body.icon; }
  }

  if (setParts.length === 0 && removeParts.length === 0) {
    return errResponse(400, 'No fields to update');
  }

  const parts: string[] = [];
  if (setParts.length > 0) parts.push(`SET ${setParts.join(', ')}`);
  if (removeParts.length > 0) parts.push(`REMOVE ${removeParts.join(', ')}`);

  await ddb.send(new UpdateCommand({
    TableName: HERO_CARDS_TABLE,
    Key: { id },
    UpdateExpression: parts.join(' '),
    ...(Object.keys(values).length > 0 ? { ExpressionAttributeValues: values } : {}),
  }));

  return ok({ updated: true });
}

export async function deleteHeroCard(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const id = event.pathParameters?.id;
  if (!id) return errResponse(400, 'Missing card id');

  const record = await ddb.send(new GetCommand({ TableName: HERO_CARDS_TABLE, Key: { id } }));

  if (record.Item?.imageUrl) {
    const imageKey = (record.Item.imageUrl as string).replace(/^https?:\/\/[^/]+\//, '');
    await s3.send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: imageKey }));
  }

  await ddb.send(new DeleteCommand({ TableName: HERO_CARDS_TABLE, Key: { id } }));

  return ok({ deleted: true });
}

export async function presignHeroCardImage(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const { cardId, filename, contentType }: { cardId: string; filename: string; contentType: string } =
    JSON.parse(event.body ?? '{}');

  if (!cardId || !filename || !contentType) {
    return errResponse(400, 'cardId, filename, and contentType are required');
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const imageKey = `hero-cards/${cardId}-${Date.now()}.${ext}`;

  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: MEDIA_BUCKET,
    Key: imageKey,
    ContentType: contentType,
  }), { expiresIn: 300 });

  return ok({ uploadUrl, imageUrl: mediaUrl(imageKey) });
}
