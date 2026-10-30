import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { getStripe, getWebhookSecret, __resetStripeCache } from './stripeClient';

jest.mock('stripe', () => jest.fn().mockImplementation((key: string) => ({ key })));

const smMock = mockClient(SecretsManagerClient);

function secret(value: string) {
  smMock.on(GetSecretValueCommand).resolves({ SecretString: value });
}

beforeEach(() => {
  smMock.reset();
  __resetStripeCache();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getStripe', () => {
  it('returns null for the CDK-generated placeholder (not JSON)', async () => {
    secret('aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY');
    expect(await getStripe()).toBeNull();
  });

  it('returns null when secretKey does not start with sk_', async () => {
    secret(JSON.stringify({ secretKey: 'pk_test_123', webhookSecret: 'whsec_1' }));
    expect(await getStripe()).toBeNull();
  });

  it('returns null when the secret cannot be read', async () => {
    smMock.on(GetSecretValueCommand).rejects(new Error('ResourceNotFoundException'));
    expect(await getStripe()).toBeNull();
  });

  it('returns a client built with the secret key', async () => {
    secret(JSON.stringify({ secretKey: 'sk_test_abc', webhookSecret: 'whsec_def' }));
    expect(await getStripe()).toEqual({ key: 'sk_test_abc' });
  });

  it('reads Secrets Manager once per cold start', async () => {
    secret(JSON.stringify({ secretKey: 'sk_test_abc', webhookSecret: 'whsec_def' }));
    await getStripe();
    await getStripe();
    await getWebhookSecret();
    expect(smMock).toHaveReceivedCommandTimes(GetSecretValueCommand, 1);
  });
});

describe('getWebhookSecret', () => {
  it('returns the webhook secret when valid', async () => {
    secret(JSON.stringify({ secretKey: 'sk_test_abc', webhookSecret: 'whsec_def' }));
    expect(await getWebhookSecret()).toBe('whsec_def');
  });

  it('returns null when missing', async () => {
    secret(JSON.stringify({ secretKey: 'sk_test_abc' }));
    expect(await getWebhookSecret()).toBeNull();
  });
});
