import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from './forms';

const ddbMock = mockClient(DynamoDBDocumentClient);
const sesMock = mockClient(SESClient);
const smMock = mockClient(SecretsManagerClient);

const asResult = (r: unknown) => r as APIGatewayProxyStructuredResultV2;

function makeEvent(body: object): APIGatewayProxyEventV2 {
  return {
    requestContext: { http: { method: 'POST', sourceIp: '1.2.3.4' } },
    rawPath: '/api/forms/contact',
    body: JSON.stringify(body),
  } as unknown as APIGatewayProxyEventV2;
}

beforeEach(() => {
  ddbMock.reset();
  sesMock.reset();
  smMock.reset();
  ddbMock.on(PutCommand).resolves({});
  sesMock.on(SendEmailCommand).resolves({});
  delete process.env.TURNSTILE_ENFORCE;
});

afterEach(() => {
  delete process.env.TURNSTILE_ENFORCE;
});

const validBody = { name: 'Alice', email: 'alice@example.com', subject: 'Hi', message: 'Hello there' };

describe('POST /api/forms/* — Turnstile gating', () => {
  it('allows submission through when enforcement is off, even with no token', async () => {
    process.env.TURNSTILE_ENFORCE = 'false';
    smMock.on(GetSecretValueCommand).resolves({ SecretString: 'test-secret' });
    const result = asResult(await handler(makeEvent(validBody)));
    expect(result.statusCode).toBe(201);
  });

  it('rejects with 403 when enforcement is on and token is missing', async () => {
    process.env.TURNSTILE_ENFORCE = 'true';
    const result = asResult(await handler(makeEvent(validBody)));
    expect(result.statusCode).toBe(403);
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
  });

  it('rejects with 403 when enforcement is on and Cloudflare verification fails', async () => {
    process.env.TURNSTILE_ENFORCE = 'true';
    smMock.on(GetSecretValueCommand).resolves({ SecretString: 'test-secret' });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) });
    const result = asResult(await handler(makeEvent({ ...validBody, turnstileToken: 'bad-token' })));
    expect(result.statusCode).toBe(403);
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
  });

  it('allows submission through when enforcement is on and Cloudflare verification succeeds', async () => {
    process.env.TURNSTILE_ENFORCE = 'true';
    smMock.on(GetSecretValueCommand).resolves({ SecretString: 'test-secret' });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const result = asResult(await handler(makeEvent({ ...validBody, turnstileToken: 'good-token' })));
    expect(result.statusCode).toBe(201);
  });
});
