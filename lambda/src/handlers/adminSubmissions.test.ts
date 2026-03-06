import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { listArtists, listSponsors, listEmailSignups, updateSponsorNotes } from './adminSubmissions';

// Mock SecretsManagerClient at the class level to intercept adminSubmissions.ts's private sm instance
const smMock = mockClient(SecretsManagerClient);
const ddbMock = mockClient(DynamoDBDocumentClient);

const VALID_KEY = 'test-admin-key';
const asResult = (r: unknown) => r as APIGatewayProxyStructuredResultV2;

function makeEvent(opts: { key?: string; body?: string } = {}): APIGatewayProxyEventV2 {
  return {
    headers: opts.key ? { 'x-admin-key': opts.key } : {},
    body: opts.body,
  } as unknown as APIGatewayProxyEventV2;
}

beforeEach(() => {
  ddbMock.reset();
  smMock.reset();
  smMock.on(GetSecretValueCommand).resolves({ SecretString: VALID_KEY });
});

// ── listArtists ───────────────────────────────────────────────────────────────

describe('listArtists', () => {
  it('returns 401 when no admin key provided', async () => {
    const result = asResult(await listArtists(makeEvent()));
    expect(result.statusCode).toBe(401);
  });

  it('returns 401 when wrong admin key', async () => {
    const result = asResult(await listArtists(makeEvent({ key: 'wrong' })));
    expect(result.statusCode).toBe(401);
  });

  it('returns artists list when valid admin key', async () => {
    const items = [{ id: 'a1', djName: 'DJ Test', status: 'pending' }];
    ddbMock.on(QueryCommand).resolves({ Items: items });
    const result = asResult(await listArtists(makeEvent({ key: VALID_KEY })));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({ artists: items });
  });

  it('returns empty array when no artists', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: undefined });
    const result = asResult(await listArtists(makeEvent({ key: VALID_KEY })));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({ artists: [] });
  });
});

// ── listSponsors ──────────────────────────────────────────────────────────────

describe('listSponsors', () => {
  it('returns 401 when wrong admin key', async () => {
    const result = asResult(await listSponsors(makeEvent({ key: 'wrong' })));
    expect(result.statusCode).toBe(401);
  });

  it('returns sponsors list when valid admin key', async () => {
    const items = [{ id: 's1', company: 'Acme', status: 'pending' }];
    ddbMock.on(QueryCommand).resolves({ Items: items });
    const result = asResult(await listSponsors(makeEvent({ key: VALID_KEY })));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({ sponsors: items });
  });
});

// ── listEmailSignups ──────────────────────────────────────────────────────────

describe('listEmailSignups', () => {
  it('returns 401 when wrong admin key', async () => {
    const result = asResult(await listEmailSignups(makeEvent({ key: 'wrong' })));
    expect(result.statusCode).toBe(401);
  });

  it('returns signups list when valid admin key', async () => {
    const items = [{ id: 'u1', email: 'a@b.com', status: 'pending' }];
    ddbMock.on(QueryCommand).resolves({ Items: items });
    const result = asResult(await listEmailSignups(makeEvent({ key: VALID_KEY })));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({ signups: items });
  });
});

// ── updateSponsorNotes ────────────────────────────────────────────────────────

describe('updateSponsorNotes', () => {
  it('returns 401 when wrong admin key', async () => {
    const result = asResult(await updateSponsorNotes(
      makeEvent({ key: 'wrong', body: JSON.stringify({ notes: 'test' }) }),
      'sponsor-id',
    ));
    expect(result.statusCode).toBe(401);
  });

  it('updates notes and returns 200', async () => {
    ddbMock.on(UpdateCommand).resolves({});
    const result = asResult(await updateSponsorNotes(
      makeEvent({ key: VALID_KEY, body: JSON.stringify({ notes: 'Good prospect' }) }),
      'sponsor-id',
    ));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({ updated: true });
    expect(ddbMock).toHaveReceivedCommandWith(UpdateCommand, {
      TableName: process.env.SPONSOR_INQUIRIES_TABLE,
      Key: { id: 'sponsor-id' },
      ExpressionAttributeValues: { ':n': 'Good prospect' },
    });
  });

  it('defaults to empty string when notes value is not a string', async () => {
    ddbMock.on(UpdateCommand).resolves({});
    await updateSponsorNotes(
      makeEvent({ key: VALID_KEY, body: JSON.stringify({ notes: null }) }),
      'sponsor-id',
    );
    expect(ddbMock).toHaveReceivedCommandWith(UpdateCommand, {
      ExpressionAttributeValues: { ':n': '' },
    });
  });
});
