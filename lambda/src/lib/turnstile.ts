import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const sm = new SecretsManagerClient({});
const TURNSTILE_SECRET_ARN = process.env.TURNSTILE_SECRET_ARN!;

let cachedSecret: string | null = null;

async function getSecret(): Promise<string> {
  if (!cachedSecret) {
    const r = await sm.send(new GetSecretValueCommand({ SecretId: TURNSTILE_SECRET_ARN }));
    cachedSecret = r.SecretString!;
  }
  return cachedSecret;
}

/**
 * Verifies a Cloudflare Turnstile token server-side. Fails closed — any
 * missing token, network error, timeout, or non-success response returns false.
 */
export async function verifyTurnstileToken(token: unknown, remoteIp: string | undefined): Promise<boolean> {
  if (typeof token !== 'string' || !token) return false;

  try {
    const secret = await getSecret();
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: controller.signal,
      });
      if (!res.ok) return false;
      const data = await res.json() as { success?: boolean };
      return data.success === true;
    } finally {
      clearTimeout(timeout);
    }
  } catch (e) {
    console.error('Turnstile verification failed:', e);
    return false;
  }
}

/**
 * Whether Turnstile verification failures should actually block the request.
 * Soft-gated during rollout so the backend can be deployed before the
 * frontend starts sending tokens without breaking every form submission.
 */
export function isTurnstileEnforced(): boolean {
  return process.env.TURNSTILE_ENFORCE === 'true';
}
