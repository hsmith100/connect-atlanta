import Stripe from 'stripe';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const sm = new SecretsManagerClient({});
const STRIPE_SECRET_ARN = process.env.STRIPE_SECRET_ARN!;

interface StripeSecret {
  secretKey: string | null;
  webhookSecret: string | null;
}

// Cached per cold start. Rotating the secret requires a Lambda config change to force a cold start.
let cachedSecret: StripeSecret | null = null;
let cachedClient: Stripe | null = null;

// Until a real key is written after deploy, the secret holds a CDK-generated placeholder
// string (not JSON). A missing or unreadable secret is treated the same way, so checkout
// returns 503 "not available yet" instead of a 500.
async function loadSecret(): Promise<StripeSecret> {
  if (cachedSecret) return cachedSecret;
  try {
    const r = await sm.send(new GetSecretValueCommand({ SecretId: STRIPE_SECRET_ARN }));
    const parsed = JSON.parse(r.SecretString ?? '') as Partial<StripeSecret>;
    cachedSecret = {
      secretKey: typeof parsed.secretKey === 'string' && parsed.secretKey.startsWith('sk_') ? parsed.secretKey : null,
      webhookSecret: typeof parsed.webhookSecret === 'string' && parsed.webhookSecret.startsWith('whsec_') ? parsed.webhookSecret : null,
    };
  } catch (e) {
    console.error('Stripe secret unavailable:', e instanceof Error ? e.message : e);
    cachedSecret = { secretKey: null, webhookSecret: null };
  }
  return cachedSecret;
}

export async function getStripe(): Promise<Stripe | null> {
  if (cachedClient) return cachedClient;
  const { secretKey } = await loadSecret();
  if (!secretKey) return null;
  cachedClient = new Stripe(secretKey);
  return cachedClient;
}

export async function getWebhookSecret(): Promise<string | null> {
  return (await loadSecret()).webhookSecret;
}

export function __resetStripeCache(): void {
  cachedSecret = null;
  cachedClient = null;
}
