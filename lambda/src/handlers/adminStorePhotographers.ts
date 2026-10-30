import { ScanCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type { Photographer, PhotographerCreatePayload, PhotographerUpdatePayload } from '../../../shared/types/store';
import { ok, errResponse, requireAdmin } from '../lib/photoShared';
import {
  ddb, STORE_PHOTOGRAPHERS_TABLE, newId, nowIso, readBody, created, isValidEmail, isValidPct,
} from '../lib/storeShared';

type StoredPhotographer = Photographer & { setupTokenHash?: string | null; setupTokenExpiresAt?: string | null };

// Strip secrets before returning a photographer to the admin UI.
export function toPhotographer(item: StoredPhotographer): Photographer {
  const { setupTokenHash: _hash, setupTokenExpiresAt: _exp, ...rest } = item;
  return rest;
}

export async function listPhotographers(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const items: StoredPhotographer[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const r = await ddb.send(new ScanCommand({ TableName: STORE_PHOTOGRAPHERS_TABLE, ExclusiveStartKey: startKey }));
    items.push(...((r.Items ?? []) as StoredPhotographer[]));
    startKey = r.LastEvaluatedKey;
  } while (startKey);

  const photographers = items.map(toPhotographer).sort((a, b) => a.name.localeCompare(b.name));
  return ok({ photographers });
}

export async function createPhotographer(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body = readBody<PhotographerCreatePayload>(event);
  if (!body) return errResponse(400, 'Invalid request body');
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return errResponse(400, 'Name is required');
  if (!isValidEmail(body.email)) return errResponse(400, 'A valid email is required');
  if (!isValidPct(body.commissionPct)) return errResponse(400, 'Commission must be between 0 and 100 (up to 2 decimals)');

  const now = nowIso();
  const photographer: StoredPhotographer = {
    id: newId(),
    name,
    email: body.email.trim().toLowerCase(),
    commissionPct: body.commissionPct,
    active: true,
    stripeAccountId: null,
    payoutsReady: false,
    owedCents: 0,
    setupTokenHash: null,
    setupTokenExpiresAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: STORE_PHOTOGRAPHERS_TABLE, Item: photographer }));
  return created(toPhotographer(photographer));
}

export async function updatePhotographer(event: APIGatewayProxyEventV2, id: string): Promise<APIGatewayProxyResultV2> {
  const authErr = await requireAdmin(event);
  if (authErr) return authErr;

  const body = readBody<PhotographerUpdatePayload>(event);
  if (!body) return errResponse(400, 'Invalid request body');

  const sets: string[] = ['updatedAt = :updatedAt'];
  const values: Record<string, unknown> = { ':updatedAt': nowIso() };
  const names: Record<string, string> = {};

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return errResponse(400, 'Name is required');
    sets.push('#name = :name');
    names['#name'] = 'name';
    values[':name'] = name;
  }
  if (body.email !== undefined) {
    if (!isValidEmail(body.email)) return errResponse(400, 'A valid email is required');
    sets.push('email = :email');
    values[':email'] = body.email.trim().toLowerCase();
  }
  if (body.commissionPct !== undefined) {
    if (!isValidPct(body.commissionPct)) return errResponse(400, 'Commission must be between 0 and 100 (up to 2 decimals)');
    sets.push('commissionPct = :pct');
    values[':pct'] = body.commissionPct;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') return errResponse(400, 'active must be true or false');
    sets.push('active = :active');
    values[':active'] = body.active;
  }

  try {
    const r = await ddb.send(new UpdateCommand({
      TableName: STORE_PHOTOGRAPHERS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeValues: values,
      ...(Object.keys(names).length ? { ExpressionAttributeNames: names } : {}),
      ReturnValues: 'ALL_NEW',
    }));
    return ok(toPhotographer(r.Attributes as StoredPhotographer));
  } catch (e) {
    if (e instanceof Error && e.name === 'ConditionalCheckFailedException') return errResponse(404, 'Photographer not found');
    throw e;
  }
}

export async function getPhotographer(id: string): Promise<StoredPhotographer | null> {
  const r = await ddb.send(new GetCommand({ TableName: STORE_PHOTOGRAPHERS_TABLE, Key: { id } }));
  return (r.Item as StoredPhotographer | undefined) ?? null;
}
