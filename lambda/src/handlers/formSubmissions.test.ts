import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { FORM_ROUTES } from './formSubmissions';

const ddbMock = mockClient(DynamoDBDocumentClient);
const sesMock = mockClient(SESClient);

const asResult = (r: unknown) => r as APIGatewayProxyStructuredResultV2;

beforeEach(() => {
  ddbMock.reset();
  sesMock.reset();
  sesMock.on(SendEmailCommand).resolves({});
});

// ── emailSignup ───────────────────────────────────────────────────────────────

describe('emailSignup', () => {
  const emailSignup = FORM_ROUTES['email-signup'];

  it('saves to DynamoDB and returns 201', async () => {
    ddbMock.on(PutCommand).resolves({});
    const result = asResult(await emailSignup({ name: 'Alice', email: 'alice@example.com' }));
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body as string).success).toBe(true);
    expect(ddbMock).toHaveReceivedCommandWith(PutCommand, {
      TableName: process.env.EMAIL_SIGNUPS_TABLE,
      Item: expect.objectContaining({ name: 'Alice', email: 'alice@example.com', status: 'pending' }),
    });
  });

  it('defaults source to "website"', async () => {
    ddbMock.on(PutCommand).resolves({});
    await emailSignup({ name: 'Alice', email: 'alice@example.com' });
    expect(ddbMock).toHaveReceivedCommandWith(PutCommand, {
      Item: expect.objectContaining({ source: 'website' }),
    });
  });

  it('returns 400 when email is missing', async () => {
    const result = asResult(await emailSignup({ name: 'Alice' }));
    expect(result.statusCode).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    const result = asResult(await emailSignup({ email: 'alice@example.com' }));
    expect(result.statusCode).toBe(400);
  });
});

// ── artistApplication ─────────────────────────────────────────────────────────

describe('artistApplication', () => {
  const artistApplication = FORM_ROUTES['artist-application'];

  const validPayload = {
    email: 'dj@example.com',
    fullLegalName: 'John Doe',
    djName: 'DJ John',
    city: 'Atlanta',
    phone: '555-0100',
    instagramLink: 'https://instagram.com/djjohn',
    contactMethod: 'email',
    mainGenre: 'House',
    subGenre: 'Deep House',
    livePerformanceLinks: 'https://soundcloud.com/live',
    soundcloudLink: 'https://soundcloud.com/djjohn',
    spotifyLink: 'https://spotify.com/djjohn',
    rekordboxFamiliar: 'yes',
  };

  it('creates a new application when email is not on file', async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [] });
    ddbMock.on(PutCommand).resolves({});
    const result = asResult(await artistApplication(validPayload));
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body as string).success).toBe(true);
    expect(ddbMock).toHaveReceivedCommand(ScanCommand);
    expect(ddbMock).toHaveReceivedCommand(PutCommand);
    expect(ddbMock).not.toHaveReceivedCommand(UpdateCommand);
  });

  it('upserts when email is already on file', async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [{ id: 'existing-id' }] });
    ddbMock.on(UpdateCommand).resolves({});
    const result = asResult(await artistApplication(validPayload));
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body as string).id).toBe('existing-id');
    expect(ddbMock).toHaveReceivedCommandWith(UpdateCommand, {
      Key: { id: 'existing-id' },
    });
    expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
  });

  it('returns 400 when email is missing', async () => {
    const { email: _e, ...rest } = validPayload;
    const result = asResult(await artistApplication(rest));
    expect(result.statusCode).toBe(400);
  });

  it('returns 400 when djName is missing', async () => {
    const { djName: _d, ...rest } = validPayload;
    const result = asResult(await artistApplication(rest));
    expect(result.statusCode).toBe(400);
  });
});

// ── sponsorInquiry ────────────────────────────────────────────────────────────

describe('sponsorInquiry', () => {
  const sponsorInquiry = FORM_ROUTES['sponsor-inquiry'];

  const validPayload = {
    name: 'Bob Smith',
    email: 'bob@corp.com',
    phone: '555-0200',
    company: 'Bob Corp Inc',
    productIndustry: 'Technology',
  };

  it('saves to DynamoDB, sends email, returns 201', async () => {
    ddbMock.on(PutCommand).resolves({});
    const result = asResult(await sponsorInquiry(validPayload));
    expect(result.statusCode).toBe(201);
    expect(ddbMock).toHaveReceivedCommandWith(PutCommand, {
      TableName: process.env.SPONSOR_INQUIRIES_TABLE,
    });
    expect(sesMock).toHaveReceivedCommand(SendEmailCommand);
  });

  it('email subject contains company name', async () => {
    ddbMock.on(PutCommand).resolves({});
    await sponsorInquiry(validPayload);
    expect(sesMock).toHaveReceivedCommandWith(SendEmailCommand, {
      Message: expect.objectContaining({
        Subject: { Data: expect.stringContaining('Bob Corp Inc') },
      }),
    });
  });

  it('returns 400 when company is missing', async () => {
    const { company: _c, ...rest } = validPayload;
    const result = asResult(await sponsorInquiry(rest));
    expect(result.statusCode).toBe(400);
  });

  it('still returns 201 when SES fails', async () => {
    ddbMock.on(PutCommand).resolves({});
    sesMock.on(SendEmailCommand).rejects(new Error('SES unavailable'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = asResult(await sponsorInquiry(validPayload));
    expect(result.statusCode).toBe(201);
    jest.restoreAllMocks();
  });
});

// ── contactForm ───────────────────────────────────────────────────────────────

describe('contactForm', () => {
  const contactForm = FORM_ROUTES['contact'];

  const validPayload = {
    name: 'Alice',
    email: 'alice@example.com',
    subject: 'Hello there',
    message: 'This is a test message.',
  };

  it('saves to DynamoDB, sends email, returns 201', async () => {
    ddbMock.on(PutCommand).resolves({});
    const result = asResult(await contactForm(validPayload));
    expect(result.statusCode).toBe(201);
    expect(ddbMock).toHaveReceivedCommandWith(PutCommand, {
      TableName: process.env.EMAIL_SIGNUPS_TABLE,
      Item: expect.objectContaining({ source: 'contact-form', subject: 'Hello there' }),
    });
    expect(sesMock).toHaveReceivedCommand(SendEmailCommand);
  });

  it('email subject contains the contact subject', async () => {
    ddbMock.on(PutCommand).resolves({});
    await contactForm(validPayload);
    expect(sesMock).toHaveReceivedCommandWith(SendEmailCommand, {
      Message: expect.objectContaining({
        Subject: { Data: expect.stringContaining('Hello there') },
      }),
    });
  });

  it('returns 400 when message is missing', async () => {
    const { message: _m, ...rest } = validPayload;
    const result = asResult(await contactForm(rest));
    expect(result.statusCode).toBe(400);
  });

  it('returns 400 when subject is missing', async () => {
    const { subject: _s, ...rest } = validPayload;
    const result = asResult(await contactForm(rest));
    expect(result.statusCode).toBe(400);
  });
});
