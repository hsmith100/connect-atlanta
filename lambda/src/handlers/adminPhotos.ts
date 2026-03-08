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
import type { PresignRequest, PhotoCreatePayload, PhotoUpdatePayload } from '../../../shared/types/photos';
import { ddb, s3, PHOTOS_TABLE, MEDIA_BUCKET, ok, requireAdmin, mediaUrl } from '../lib/photoShared';

export async function listAllPhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
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

export async function presignUpload(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
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

export async function createPhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
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

export async function updatePhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
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

export async function deletePhotos(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
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
