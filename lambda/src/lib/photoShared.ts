import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
export const s3 = new S3Client({});
export const sm = new SecretsManagerClient({});

export const PHOTOS_TABLE = process.env.PHOTOS_TABLE!;
export const EVENTS_TABLE = process.env.EVENTS_TABLE!;
export const MEDIA_BUCKET = process.env.MEDIA_BUCKET!;
export const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN!;
export const ADMIN_SECRET_ARN = process.env.ADMIN_SECRET_ARN!;

export const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

// Cached admin key — fetched from Secrets Manager on first admin request per cold start
let cachedAdminKey: string | null = null;

export function ok(body: object): APIGatewayProxyResultV2 {
  return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

export function errResponse(status: number, message: string): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

export async function requireAdmin(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2 | null> {
  if (!cachedAdminKey) {
    const r = await sm.send(new GetSecretValueCommand({ SecretId: ADMIN_SECRET_ARN }));
    cachedAdminKey = r.SecretString!;
  }
  const key = event.headers['x-admin-key'];
  return key === cachedAdminKey ? null : errResponse(401, 'Unauthorized');
}

export function mediaUrl(key: string): string {
  return `https://${CLOUDFRONT_DOMAIN}/${key}`;
}
