import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  generateToken, hashTokenSecret, isAllowedSiteUrl, isValidEmail, parseJson, sendEmail, mediaUrl,
  readBody, isValidPct, isValidPriceCents,
} from './storeShared';

const sesMock = mockClient(SESClient);

beforeEach(() => {
  sesMock.reset();
  process.env.SITE_ORIGIN_MODE = 'any-cloudfront';
});

describe('generateToken / hashTokenSecret', () => {
  it('round-trips: the hash of a generated token matches', () => {
    const { token, hash } = generateToken('order-1');
    expect(token.startsWith('order-1.')).toBe(true);
    expect(hashTokenSecret(token)).toEqual({ prefix: 'order-1', hash });
  });

  it('never stores the secret itself as the hash', () => {
    const { token, hash } = generateToken('o');
    expect(token).not.toContain(hash);
  });

  it('generates different tokens each time', () => {
    expect(generateToken('o').token).not.toBe(generateToken('o').token);
  });

  it.each([undefined, 123, '', 'noprefix', '.secret', 'prefix.', 'a.b.c'])(
    'returns null for malformed token %p',
    (bad) => {
      expect(hashTokenSecret(bad)).toBeNull();
    },
  );
});

describe('isAllowedSiteUrl', () => {
  it.each([
    'https://beatsontheblockfest.com',
    'https://www.beatsontheblockfest.com',
    'https://connectevents.co',
    'https://www.connectevents.co',
  ])('allows prod origin %s in both modes', (url) => {
    expect(isAllowedSiteUrl(url)).toBe(true);
    process.env.SITE_ORIGIN_MODE = 'prod';
    expect(isAllowedSiteUrl(url)).toBe(true);
  });

  it('allows cloudfront and localhost only in any-cloudfront mode', () => {
    expect(isAllowedSiteUrl('https://d36pa7dr4nksf5.cloudfront.net')).toBe(true);
    expect(isAllowedSiteUrl('http://localhost:3000')).toBe(true);
    process.env.SITE_ORIGIN_MODE = 'prod';
    expect(isAllowedSiteUrl('https://d36pa7dr4nksf5.cloudfront.net')).toBe(false);
    expect(isAllowedSiteUrl('http://localhost:3000')).toBe(false);
  });

  it.each([
    'https://evil.com',
    'https://beatsontheblockfest.com.evil.com',
    'https://evil.com/https://beatsontheblockfest.com',
    'https://x.cloudfront.net/path',
    'https://x.cloudfront.net.evil.com',
    'http://d36pa7dr4nksf5.cloudfront.net',
    'https://beatsontheblockfest.com/',
    undefined,
  ])('rejects %p', (url) => {
    expect(isAllowedSiteUrl(url)).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts a normal address', () => {
    expect(isValidEmail('buyer@example.com')).toBe(true);
  });

  it.each(['', 'no-at-sign', 'a@b', 'a b@c.com', `${'a'.repeat(250)}@x.com`, 42])('rejects %p', (bad) => {
    expect(isValidEmail(bad)).toBe(false);
  });
});

describe('parseJson', () => {
  it('parses a plain body', () => {
    const event = { body: '{"a":1}' } as APIGatewayProxyEventV2;
    expect(parseJson<{ a: number }>(event)).toEqual({ a: 1 });
  });

  it('decodes a base64 body', () => {
    const event = { body: Buffer.from('{"a":2}').toString('base64'), isBase64Encoded: true } as APIGatewayProxyEventV2;
    expect(parseJson<{ a: number }>(event)).toEqual({ a: 2 });
  });

  it('throws on a missing body', () => {
    expect(() => parseJson({} as APIGatewayProxyEventV2)).toThrow('Missing request body');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJson({ body: '{nope' } as APIGatewayProxyEventV2)).toThrow();
  });
});

describe('sendEmail', () => {
  it('sends a plain-text email from FROM_EMAIL', async () => {
    sesMock.on(SendEmailCommand).resolves({});
    await sendEmail('buyer@example.com', 'Subject', 'Body');
    expect(sesMock).toHaveReceivedCommandWith(SendEmailCommand, {
      Source: 'noreply@test.com',
      Destination: { ToAddresses: ['buyer@example.com'] },
    });
  });

  it('rethrows SES failures', async () => {
    sesMock.on(SendEmailCommand).rejects(new Error('ses down'));
    await expect(sendEmail('a@b.com', 's', 't')).rejects.toThrow('ses down');
  });
});

describe('mediaUrl', () => {
  it('builds a media CloudFront URL', () => {
    expect(mediaUrl('store/thumbs/p1-1.jpg')).toBe('https://media.test/store/thumbs/p1-1.jpg');
  });
});

describe('readBody', () => {
  it('returns parsed JSON', () => {
    expect(readBody<{ a: number }>({ body: '{"a":1}' } as APIGatewayProxyEventV2)).toEqual({ a: 1 });
  });

  it('returns null instead of throwing', () => {
    expect(readBody({ body: '{bad' } as APIGatewayProxyEventV2)).toBeNull();
    expect(readBody({} as APIGatewayProxyEventV2)).toBeNull();
  });
});

describe('isValidPct', () => {
  it.each([0, 40, 12.5, 33.33, 0.29, 57.07, 100])('accepts %p', (v) => expect(isValidPct(v)).toBe(true));
  it.each([-1, 100.01, 33.333, NaN, '40', null])('rejects %p', (v) => expect(isValidPct(v)).toBe(false));
});

describe('isValidPriceCents', () => {
  it.each([50, 1500, 100000])('accepts %p', (v) => expect(isValidPriceCents(v)).toBe(true));
  it.each([49, 0, 15.5, -100, '1500', null])('rejects %p', (v) => expect(isValidPriceCents(v)).toBe(false));
});
