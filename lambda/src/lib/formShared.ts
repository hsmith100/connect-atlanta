import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { randomUUID } from 'crypto';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
export const ses = new SESClient({ region: 'us-east-1' });

export const TABLES = {
  emailSignups: process.env.EMAIL_SIGNUPS_TABLE!,
  artistApplications: process.env.ARTIST_APPLICATIONS_TABLE!,
  sponsorInquiries: process.env.SPONSOR_INQUIRIES_TABLE!,
};

export const CONTACT_EMAIL = process.env.CONTACT_EMAIL!;
export const FROM_EMAIL = process.env.FROM_EMAIL!;

export const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

// Valid value types in a JSON form payload
export type FormPayload = Record<string, string | number | boolean | null | string[]>;

export function ok(body: object): APIGatewayProxyResultV2 {
  return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

export function created(body: object): APIGatewayProxyResultV2 {
  return { statusCode: 201, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

export function errResponse(status: number, message: string): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

export function parseBody(event: APIGatewayProxyEventV2): FormPayload {
  if (!event.body) throw new Error('Missing request body');
  try {
    return JSON.parse(event.body) as FormPayload;
  } catch {
    throw new Error('Invalid JSON body');
  }
}

export function newItem(): { id: string; status: string; createdAt: string } {
  return { id: randomUUID(), status: 'pending', createdAt: new Date().toISOString() };
}

/**
 * Validates required fields and narrows raw payload to type T.
 * Returns a discriminated union — check `result.ok` before accessing `result.data`.
 */
export function parsePayload<T>(
  raw: FormPayload,
  requiredFields: (keyof T & string)[],
): { ok: true; data: T } | { ok: false; err: APIGatewayProxyResultV2 } {
  for (const field of requiredFields) {
    if (!raw[field]) return { ok: false, err: errResponse(400, `${field} is required`) };
  }
  return { ok: true, data: raw as T };
}

export async function sendEmail(subject: string, body: string): Promise<void> {
  try {
    await ses.send(new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [CONTACT_EMAIL] },
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: body } },
      },
    }));
  } catch (e) {
    console.error('SES send failed:', e);
  }
}
