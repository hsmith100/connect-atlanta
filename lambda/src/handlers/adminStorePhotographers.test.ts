import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { listPhotographers, createPhotographer, updatePhotographer } from './adminStorePhotographers';

const smMock = mockClient(SecretsManagerClient);
const ddbMock = mockClient(DynamoDBDocumentClient);

const KEY = 'test-admin-key';
const asResult = (r: unknown) => r as APIGatewayProxyStructuredResultV2;
const bodyOf = (r: unknown) => JSON.parse(asResult(r).body as string);

function makeEvent(opts: { key?: string; body?: unknown } = {}): APIGatewayProxyEventV2 {
  return {
    headers: opts.key ? { 'x-admin-key': opts.key } : {},
    body: opts.body === undefined ? undefined : typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body),
  } as unknown as APIGatewayProxyEventV2;
}

const stored = {
  id: 'p1', name: 'Jay Ortiz', email: 'jay@example.com', commissionPct: 40, active: true,
  stripeAccountId: null, payoutsReady: false, owedCents: 0,
  setupTokenHash: 'secret-hash', setupTokenExpiresAt: '2026-11-01T00:00:00.000Z',
  createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
};

beforeEach(() => {
  ddbMock.reset();
  smMock.reset();
  smMock.on(GetSecretValueCommand).resolves({ SecretString: KEY });
});

describe('listPhotographers', () => {
  it('requires the admin key', async () => {
    expect(asResult(await listPhotographers(makeEvent())).statusCode).toBe(401);
  });

  it('returns photographers sorted by name without token fields, across scan pages', async () => {
    ddbMock.on(ScanCommand)
      .resolvesOnce({ Items: [{ ...stored, id: 'p2', name: 'Zoe' }], LastEvaluatedKey: { id: 'p2' } })
      .resolvesOnce({ Items: [stored] });
    const res = await listPhotographers(makeEvent({ key: KEY }));
    const { photographers } = bodyOf(res);
    expect(photographers.map((p: { name: string }) => p.name)).toEqual(['Jay Ortiz', 'Zoe']);
    expect(photographers[0]).not.toHaveProperty('setupTokenHash');
    expect(photographers[0]).not.toHaveProperty('setupTokenExpiresAt');
  });
});

describe('createPhotographer', () => {
  it('requires the admin key', async () => {
    expect(asResult(await createPhotographer(makeEvent({ body: {} }))).statusCode).toBe(401);
  });

  it('creates an active photographer with payment fields defaulted', async () => {
    ddbMock.on(PutCommand).resolves({});
    const res = asResult(await createPhotographer(makeEvent({
      key: KEY, body: { name: '  Jay Ortiz ', email: 'Jay@Example.com', commissionPct: 40 },
    })));
    expect(res.statusCode).toBe(201);
    const p = bodyOf(res);
    expect(p).toMatchObject({
      name: 'Jay Ortiz', email: 'jay@example.com', commissionPct: 40, active: true,
      stripeAccountId: null, payoutsReady: false, owedCents: 0,
    });
    expect(p).not.toHaveProperty('setupTokenHash');
    expect(ddbMock).toHaveReceivedCommandWith(PutCommand, { TableName: 'test-store-photographers' });
  });

  it.each([
    [{ email: 'a@b.com', commissionPct: 40 }, 'Name is required'],
    [{ name: 'A', email: 'nope', commissionPct: 40 }, 'A valid email is required'],
    [{ name: 'A', email: 'a@b.com', commissionPct: 101 }, 'Commission must be between 0 and 100 (up to 2 decimals)'],
    [{ name: 'A', email: 'a@b.com', commissionPct: 12.345 }, 'Commission must be between 0 and 100 (up to 2 decimals)'],
  ])('rejects invalid input %p', async (body, message) => {
    const res = await createPhotographer(makeEvent({ key: KEY, body }));
    expect(asResult(res).statusCode).toBe(400);
    expect(bodyOf(res).error).toBe(message);
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
  });

  it('rejects a malformed body with 400', async () => {
    expect(asResult(await createPhotographer(makeEvent({ key: KEY, body: '{bad' }))).statusCode).toBe(400);
  });
});

describe('updatePhotographer', () => {
  it('requires the admin key', async () => {
    expect(asResult(await updatePhotographer(makeEvent({ body: {} }), 'p1')).statusCode).toBe(401);
  });

  it('updates only provided fields and returns the photographer without token fields', async () => {
    ddbMock.on(UpdateCommand).resolves({ Attributes: { ...stored, commissionPct: 50, active: false } });
    const res = await updatePhotographer(makeEvent({ key: KEY, body: { commissionPct: 50, active: false } }), 'p1');
    expect(asResult(res).statusCode).toBe(200);
    expect(bodyOf(res)).toMatchObject({ commissionPct: 50, active: false });
    expect(bodyOf(res)).not.toHaveProperty('setupTokenHash');
    const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input;
    expect(input.UpdateExpression).toBe('SET updatedAt = :updatedAt, commissionPct = :pct, active = :active');
    expect(input.ConditionExpression).toBe('attribute_exists(id)');
  });

  it('uses an attribute name placeholder for the reserved word "name"', async () => {
    ddbMock.on(UpdateCommand).resolves({ Attributes: stored });
    await updatePhotographer(makeEvent({ key: KEY, body: { name: 'New Name' } }), 'p1');
    const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input;
    expect(input.ExpressionAttributeNames).toEqual({ '#name': 'name' });
  });

  it('returns 404 when the photographer does not exist', async () => {
    const err = Object.assign(new Error('cond'), { name: 'ConditionalCheckFailedException' });
    ddbMock.on(UpdateCommand).rejects(err);
    expect(asResult(await updatePhotographer(makeEvent({ key: KEY, body: { active: true } }), 'missing')).statusCode).toBe(404);
  });

  it.each([
    [{ name: '' }],
    [{ email: 'bad' }],
    [{ commissionPct: -5 }],
    [{ active: 'yes' }],
  ])('rejects invalid update %p', async (body) => {
    expect(asResult(await updatePhotographer(makeEvent({ key: KEY, body }), 'p1')).statusCode).toBe(400);
    expect(ddbMock).not.toHaveReceivedCommand(UpdateCommand);
  });
});
