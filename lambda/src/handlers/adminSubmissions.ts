import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ddb, TABLES, ok, errResponse, parseBody } from '../lib/formShared';

const sm = new SecretsManagerClient({});
const ADMIN_SECRET_ARN = process.env.ADMIN_SECRET_ARN!;

let cachedAdminKey: string | null = null;

async function requireAdmin(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2 | null> {
  if (!cachedAdminKey) {
    const r = await sm.send(new GetSecretValueCommand({ SecretId: ADMIN_SECRET_ARN }));
    cachedAdminKey = r.SecretString!;
  }
  const key = event.headers['x-admin-key'];
  return key === cachedAdminKey ? null : errResponse(401, 'Unauthorized');
}

export async function listArtists(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const result = await ddb.send(new QueryCommand({
    TableName: TABLES.artistApplications,
    IndexName: 'byStatus',
    KeyConditionExpression: '#s = :s',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':s': 'pending' },
    ScanIndexForward: false,
  }));

  return ok({ artists: result.Items ?? [] });
}

export async function listSponsors(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const result = await ddb.send(new QueryCommand({
    TableName: TABLES.sponsorInquiries,
    IndexName: 'byStatus',
    KeyConditionExpression: '#s = :s',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':s': 'pending' },
    ScanIndexForward: false,
  }));

  return ok({ sponsors: result.Items ?? [] });
}

export async function updateSponsorNotes(event: APIGatewayProxyEventV2, id: string): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body = parseBody(event);
  const notes = typeof body.notes === 'string' ? body.notes : '';

  await ddb.send(new UpdateCommand({
    TableName: TABLES.sponsorInquiries,
    Key: { id },
    UpdateExpression: 'SET notes = :n',
    ExpressionAttributeValues: { ':n': notes },
  }));

  return ok({ updated: true });
}

export async function listEmailSignups(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const result = await ddb.send(new QueryCommand({
    TableName: TABLES.emailSignups,
    IndexName: 'byStatus',
    KeyConditionExpression: '#s = :s',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':s': 'pending' },
    ScanIndexForward: false,
  }));

  return ok({ signups: result.Items ?? [] });
}
