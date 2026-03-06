import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import {
  ok,
  created,
  errResponse,
  parseBody,
  parsePayload,
  newItem,
  sendEmail,
  ses,
  CORS_HEADERS,
} from './formShared';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

const sesMock = mockClient(ses);

beforeEach(() => {
  sesMock.reset();
});

// Convenience cast: our helpers always return the structured variant, never plain string
const asResult = (r: unknown) => r as APIGatewayProxyStructuredResultV2;

// ── ok / created / errResponse ────────────────────────────────────────────────

describe('ok', () => {
  it('returns 200 with JSON body and CORS headers', () => {
    const result = asResult(ok({ message: 'hello' }));
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ message: 'hello' }));
    expect(result.headers).toEqual(CORS_HEADERS);
  });
});

describe('created', () => {
  it('returns 201 with JSON body', () => {
    const result = asResult(created({ id: 'abc' }));
    expect(result.statusCode).toBe(201);
    expect(result.body).toBe(JSON.stringify({ id: 'abc' }));
    expect(result.headers).toEqual(CORS_HEADERS);
  });
});

describe('errResponse', () => {
  it('returns the given status with error message shape', () => {
    const result = asResult(errResponse(400, 'Bad Request'));
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string)).toEqual({ error: 'Bad Request' });
    expect(result.headers).toEqual(CORS_HEADERS);
  });

  it('works for 404 and 500', () => {
    expect(asResult(errResponse(404, 'Not found')).statusCode).toBe(404);
    expect(asResult(errResponse(500, 'Server error')).statusCode).toBe(500);
  });
});

// ── parseBody ─────────────────────────────────────────────────────────────────

function makeEvent(body?: string): APIGatewayProxyEventV2 {
  return { body } as unknown as APIGatewayProxyEventV2;
}

describe('parseBody', () => {
  it('parses a valid JSON body', () => {
    const result = parseBody(makeEvent('{"name":"Alice"}'));
    expect(result).toEqual({ name: 'Alice' });
  });

  it('throws on missing body', () => {
    expect(() => parseBody(makeEvent(undefined))).toThrow('Missing request body');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseBody(makeEvent('{bad json}'))).toThrow('Invalid JSON body');
  });
});

// ── parsePayload ──────────────────────────────────────────────────────────────

describe('parsePayload', () => {
  it('returns ok:true with typed data when all required fields present', () => {
    const raw = { name: 'Alice', email: 'alice@example.com' };
    type T = { name: string; email: string };
    const result = parsePayload<T>(raw, ['name', 'email']);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('Alice');
      expect(result.data.email).toBe('alice@example.com');
    }
  });

  it('returns ok:false with 400 error when a required field is missing', () => {
    const raw = { name: 'Alice' };
    type T = { name: string; email: string };
    const result = parsePayload<T>(raw, ['name', 'email']);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const err = asResult(result.err);
      expect(err.statusCode).toBe(400);
      expect(JSON.parse(err.body as string)).toEqual({ error: 'email is required' });
    }
  });

  it('returns ok:false for the first missing field', () => {
    const raw = {};
    type T = { a: string; b: string };
    const result = parsePayload<T>(raw, ['a', 'b']);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const err = asResult(result.err);
      expect(JSON.parse(err.body as string)).toEqual({ error: 'a is required' });
    }
  });
});

// ── newItem ───────────────────────────────────────────────────────────────────

describe('newItem', () => {
  it('returns an object with id, status=pending, and a valid ISO createdAt', () => {
    const item = newItem();
    expect(typeof item.id).toBe('string');
    expect(item.id).toMatch(/^[0-9a-f-]{36}$/); // UUID v4 pattern
    expect(item.status).toBe('pending');
    expect(() => new Date(item.createdAt)).not.toThrow();
    expect(new Date(item.createdAt).toISOString()).toBe(item.createdAt);
  });

  it('generates a unique id each call', () => {
    expect(newItem().id).not.toBe(newItem().id);
  });
});

// ── sendEmail ─────────────────────────────────────────────────────────────────

describe('sendEmail', () => {
  it('calls SES SendEmailCommand with subject and body', async () => {
    sesMock.on(SendEmailCommand).resolves({});
    await sendEmail('Test subject', 'Test body');
    expect(sesMock).toHaveReceivedCommandWith(SendEmailCommand, {
      Message: {
        Subject: { Data: 'Test subject' },
        Body: { Text: { Data: 'Test body' } },
      },
    });
  });

  it('does not throw when SES fails (non-fatal)', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    sesMock.on(SendEmailCommand).rejects(new Error('SES unavailable'));
    await expect(sendEmail('subject', 'body')).resolves.toBeUndefined();
    errorSpy.mockRestore();
  });
});
