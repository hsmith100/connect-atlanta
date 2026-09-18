import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { verifyTurnstileToken, isTurnstileEnforced } from './turnstile';

const smMock = mockClient(SecretsManagerClient);

const originalFetch = global.fetch;

beforeEach(() => {
  smMock.reset();
  smMock.on(GetSecretValueCommand).resolves({ SecretString: 'test-secret' });
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.TURNSTILE_ENFORCE;
});

describe('verifyTurnstileToken', () => {
  it('returns false and makes no network call when token is missing', async () => {
    const result = await verifyTurnstileToken(undefined, '1.2.3.4');
    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns false and makes no network call when token is not a string', async () => {
    const result = await verifyTurnstileToken(123, '1.2.3.4');
    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns true when Cloudflare responds with success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    const result = await verifyTurnstileToken('valid-token', '1.2.3.4');
    expect(result).toBe(true);
  });

  it('returns false when Cloudflare responds with success: false', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    });
    const result = await verifyTurnstileToken('bad-token', '1.2.3.4');
    expect(result).toBe(false);
  });

  it('returns false when Cloudflare responds with a non-2xx status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({}) });
    const result = await verifyTurnstileToken('token', '1.2.3.4');
    expect(result).toBe(false);
  });

  it('returns false when fetch throws (network error/timeout)', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network error'));
    const result = await verifyTurnstileToken('token', '1.2.3.4');
    expect(result).toBe(false);
  });
});

describe('isTurnstileEnforced', () => {
  it('returns false when TURNSTILE_ENFORCE is unset', () => {
    delete process.env.TURNSTILE_ENFORCE;
    expect(isTurnstileEnforced()).toBe(false);
  });

  it('returns true when TURNSTILE_ENFORCE is "true"', () => {
    process.env.TURNSTILE_ENFORCE = 'true';
    expect(isTurnstileEnforced()).toBe(true);
  });

  it('returns false when TURNSTILE_ENFORCE is any other value', () => {
    process.env.TURNSTILE_ENFORCE = 'yes';
    expect(isTurnstileEnforced()).toBe(false);
  });
});
