import { randomBytes, randomUUID, createHash } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
export const s3 = new S3Client({});
export const ses = new SESClient({ region: 'us-east-1' });

export const STORE_COLLECTIONS_TABLE = process.env.STORE_COLLECTIONS_TABLE!;
export const STORE_PHOTOS_TABLE = process.env.STORE_PHOTOS_TABLE!;
export const STORE_PHOTOGRAPHERS_TABLE = process.env.STORE_PHOTOGRAPHERS_TABLE!;
export const STORE_ORDERS_TABLE = process.env.STORE_ORDERS_TABLE!;
export const EVENTS_TABLE = process.env.EVENTS_TABLE!;
export const MEDIA_BUCKET = process.env.MEDIA_BUCKET!;
export const ORIGINALS_BUCKET = process.env.ORIGINALS_BUCKET!;
export const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN!;
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL!;
export const FROM_EMAIL = process.env.FROM_EMAIL!;

const PROD_ORIGINS = [
  'https://beatsontheblockfest.com',
  'https://www.beatsontheblockfest.com',
  'https://connectevents.co',
  'https://www.connectevents.co',
];

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function mediaUrl(key: string): string {
  return `https://${CLOUDFRONT_DOMAIN}/${key}`;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

// Tokens look like "<prefix>.<secret>". Only the hash of the secret is stored, so a
// leaked database row can't be turned back into a working link. The prefix (an order
// or photographer id) tells us which record to look up.
export function generateToken(prefix: string): { token: string; hash: string } {
  const secret = randomBytes(32).toString('base64url');
  return { token: `${prefix}.${secret}`, hash: sha256(secret) };
}

export function hashTokenSecret(token: unknown): { prefix: string; hash: string } | null {
  if (typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;
  const prefix = token.slice(0, dot);
  const secret = token.slice(dot + 1);
  if (secret.includes('.')) return null;
  return { prefix, hash: sha256(secret) };
}

export function isAllowedSiteUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  if (PROD_ORIGINS.includes(url)) return true;
  if (process.env.SITE_ORIGIN_MODE !== 'any-cloudfront') return false;
  return /^https:\/\/[a-z0-9]+\.cloudfront\.net$/.test(url) || url === 'http://localhost:3000';
}

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string'
    && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseJson<T>(event: APIGatewayProxyEventV2): T {
  if (!event.body) throw new Error('Missing request body');
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  return JSON.parse(raw) as T;
}

// Rethrows on failure — callers decide whether an email failure is fatal.
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  await ses.send(new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Text: { Data: text } },
    },
  }));
}
