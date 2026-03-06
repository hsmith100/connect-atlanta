import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { mediaUrl, CLOUDFRONT_DOMAIN, sm, requireAdmin } from './photoShared';

const asResult = (r: unknown) => r as APIGatewayProxyStructuredResultV2;

// Mock the SecretsManagerClient class so all instances (including the module-level sm) are intercepted
const smMock = mockClient(SecretsManagerClient);

function makeEvent(key?: string): APIGatewayProxyEventV2 {
  return { headers: key ? { 'x-admin-key': key } : {} } as unknown as APIGatewayProxyEventV2;
}

const VALID_KEY = 'super-secret-key';

// ── mediaUrl ──────────────────────────────────────────────────────────────────
// CLOUDFRONT_DOMAIN is captured at module load time from process.env.
// Tests verify URL construction logic using the actual module constant.

describe('mediaUrl', () => {
  it('constructs a URL using CLOUDFRONT_DOMAIN and key', () => {
    expect(mediaUrl('photos/abc.jpg')).toBe(`https://${CLOUDFRONT_DOMAIN}/photos/abc.jpg`);
  });

  it('works for flyer keys', () => {
    expect(mediaUrl('flyers/event-123-456.jpg')).toBe(`https://${CLOUDFRONT_DOMAIN}/flyers/event-123-456.jpg`);
  });

  it('works for thumbnail keys', () => {
    expect(mediaUrl('photos/thumbs/abc.webp')).toBe(`https://${CLOUDFRONT_DOMAIN}/photos/thumbs/abc.webp`);
  });

  it('constructs correct format https://<domain>/<key>', () => {
    const key = 'some/path/file.jpg';
    const url = mediaUrl(key);
    expect(url).toMatch(/^https:\/\/.+\/.+/);
    expect(url).toContain(key);
  });
});

// ── requireAdmin ──────────────────────────────────────────────────────────────
// Auth checks (null / 401) work correctly regardless of whether cachedAdminKey
// is populated from a previous test, since all tests use the same VALID_KEY.

describe('requireAdmin', () => {
  beforeEach(() => {
    smMock.reset();
    smMock.on(GetSecretValueCommand).resolves({ SecretString: VALID_KEY });
  });

  it('returns null when header matches the secret', async () => {
    expect(await requireAdmin(makeEvent(VALID_KEY))).toBeNull();
  });

  it('returns 401 when header is missing', async () => {
    const result = asResult(await requireAdmin(makeEvent(undefined)));
    expect(result.statusCode).toBe(401);
  });

  it('returns 401 when header has wrong key', async () => {
    const result = asResult(await requireAdmin(makeEvent('wrong-key')));
    expect(result.statusCode).toBe(401);
  });

  it('caches the key — only calls Secrets Manager once across multiple calls', async () => {
    // Use isolated modules so cachedAdminKey starts as null for this test.
    // Use freshMock.commandCalls() (plain API, no cross-context Jest matchers).
    await jest.isolateModulesAsync(async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { mockClient: mc } = require('aws-sdk-client-mock');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GetSecretValueCommand: GSV } = require('@aws-sdk/client-secrets-manager');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const freshMod = require('./photoShared');
      const freshMock = mc(freshMod.sm);
      freshMock.on(GSV).resolves({ SecretString: VALID_KEY });

      await freshMod.requireAdmin(makeEvent(VALID_KEY));
      await freshMod.requireAdmin(makeEvent(VALID_KEY));
      await freshMod.requireAdmin(makeEvent('wrong'));

      expect(freshMock.commandCalls(GSV)).toHaveLength(1);
      freshMock.restore();
    });
  });
});

// Verify sm is the exported instance (used by mockClient above)
test('sm is a SecretsManagerClient instance', () => {
  expect(sm).toBeInstanceOf(SecretsManagerClient);
});
