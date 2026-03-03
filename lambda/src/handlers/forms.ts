import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESClient({ region: 'us-east-1' });

const TABLES = {
  emailSignups: process.env.EMAIL_SIGNUPS_TABLE!,
  vendorApplications: process.env.VENDOR_APPLICATIONS_TABLE!,
  volunteerApplications: process.env.VOLUNTEER_APPLICATIONS_TABLE!,
  artistApplications: process.env.ARTIST_APPLICATIONS_TABLE!,
  sponsorInquiries: process.env.SPONSOR_INQUIRIES_TABLE!,
};

const CONTACT_EMAIL = process.env.CONTACT_EMAIL!;
const FROM_EMAIL = process.env.FROM_EMAIL!;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function created(body: unknown): APIGatewayProxyResultV2 {
  return { statusCode: 201, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

function errResponse(status: number, message: string): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

function parseBody(event: APIGatewayProxyEventV2): Record<string, unknown> {
  if (!event.body) throw new Error('Missing request body');
  try {
    return JSON.parse(event.body);
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function newItem(): { id: string; status: string; createdAt: string } {
  return { id: randomUUID(), status: 'pending', createdAt: new Date().toISOString() };
}

async function sendEmail(subject: string, body: string): Promise<void> {
  try {
    await ses.send(new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [CONTACT_EMAIL] },
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: body } },
      },
    }));
  } catch (e) {
    // Non-fatal — log and continue. SES may not be verified yet.
    console.warn('SES send failed (non-fatal):', e);
  }
}

// ── Form handlers ────────────────────────────────────────────────────────────

async function emailSignup(data: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const { name, email, phone, source } = data;
  // Accept both camelCase and snake_case from frontend
  const marketingConsent = data.marketingConsent ?? data.marketing_consent ?? false;
  if (!name || !email) return errResponse(400, 'name and email are required');

  const item = {
    ...newItem(),
    name,
    email,
    phone: phone ?? null,
    marketingConsent,
    source: source ?? 'website',
  };

  await ddb.send(new PutCommand({ TableName: TABLES.emailSignups, Item: item }));

  return created({
    success: true,
    message: "Thank you for signing up! We'll keep you updated on upcoming events.",
    id: item.id,
    createdAt: item.createdAt,
  });
}

async function vendorApplication(data: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const required = ['businessName', 'contactName', 'email', 'phone', 'businessType', 'description', 'websiteSocial', 'pricePoint', 'hasInsurance', 'foodPermit', 'setup'];
  for (const field of required) {
    if (!data[field]) return errResponse(400, `${field} is required`);
  }

  const item = {
    ...newItem(),
    businessName: data.businessName,
    contactName: data.contactName,
    email: data.email,
    phone: data.phone,
    businessType: data.businessType,
    description: data.description,
    websiteSocial: data.websiteSocial,
    pricePoint: data.pricePoint,
    hasInsurance: data.hasInsurance,
    foodPermit: data.foodPermit,
    setup: data.setup,
    additionalComments: data.additionalComments ?? null,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.vendorApplications, Item: item }));

  return created({
    success: true,
    message: "Thank you for your vendor application! We'll review it and get back to you soon.",
    id: item.id,
    createdAt: item.createdAt,
  });
}

async function volunteerApplication(data: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const required = ['firstName', 'lastName', 'email', 'phone'];
  for (const field of required) {
    if (!data[field]) return errResponse(400, `${field} is required`);
  }

  const item = {
    ...newItem(),
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    experience: data.experience ?? null,
    skills: Array.isArray(data.skills) ? data.skills : [],
  };

  await ddb.send(new PutCommand({ TableName: TABLES.volunteerApplications, Item: item }));

  return created({
    success: true,
    message: "Thank you for volunteering! We'll be in touch with next steps.",
    id: item.id,
    createdAt: item.createdAt,
  });
}

async function artistApplication(data: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const required = ['email', 'fullLegalName', 'djName', 'city', 'phone', 'instagramLink', 'contactMethod', 'artistBio', 'b2bFavorite', 'mainGenre', 'subGenre', 'livePerformanceLinks', 'soundcloudLink', 'spotifyLink', 'rekordboxFamiliar', 'promoKitLinks'];
  for (const field of required) {
    if (!data[field]) return errResponse(400, `${field} is required`);
  }

  const item = {
    ...newItem(),
    email: data.email,
    fullLegalName: data.fullLegalName,
    djName: data.djName,
    city: data.city,
    phone: data.phone,
    instagramLink: data.instagramLink,
    contactMethod: data.contactMethod,
    artistBio: data.artistBio,
    b2bFavorite: data.b2bFavorite,
    mainGenre: data.mainGenre,
    subGenre: data.subGenre,
    otherSubGenre: data.otherSubGenre ?? null,
    otherGenreText: data.otherGenreText ?? null,
    livePerformanceLinks: data.livePerformanceLinks,
    soundcloudLink: data.soundcloudLink,
    spotifyLink: data.spotifyLink,
    rekordboxFamiliar: data.rekordboxFamiliar,
    promoKitLinks: data.promoKitLinks,
    additionalInfo: data.additionalInfo ?? null,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.artistApplications, Item: item }));

  return created({
    success: true,
    message: "Thank you for your artist application! We'll review your submission and contact you soon.",
    id: item.id,
    createdAt: item.createdAt,
  });
}

async function sponsorInquiry(data: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const required = ['name', 'email', 'phone', 'company', 'productIndustry'];
  for (const field of required) {
    if (!data[field]) return errResponse(400, `${field} is required`);
  }

  const item = {
    ...newItem(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    productIndustry: data.productIndustry,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.sponsorInquiries, Item: item }));

  // Notify team via email
  await sendEmail(
    `New Sponsor Inquiry from ${data.company}`,
    `New Sponsor Inquiry\n\nName: ${data.name}\nCompany: ${data.company}\nEmail: ${data.email}\nPhone: ${data.phone}\n\nProduct/Industry:\n${data.productIndustry}\n\nSubmitted via connectevents.co`,
  );

  return created({
    success: true,
    message: "Thank you for your interest in sponsoring! A team member will reach out to you soon.",
    id: item.id,
    createdAt: item.createdAt,
  });
}

async function contactForm(data: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const required = ['name', 'email', 'subject', 'message'];
  for (const field of required) {
    if (!data[field]) return errResponse(400, `${field} is required`);
  }

  await sendEmail(
    `Contact Form: ${data.subject}`,
    `New Contact Form Submission\n\nFrom: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject}\n\nMessage:\n${data.message}\n\n---\nSent via connectevents.co`,
  );

  return created({
    success: true,
    message: "Message sent successfully! We'll get back to you soon.",
  });
}

// ── Router ───────────────────────────────────────────────────────────────────

const ROUTES: Record<string, (data: Record<string, unknown>) => Promise<APIGatewayProxyResultV2>> = {
  'email-signup': emailSignup,
  'vendor-application': vendorApplication,
  'volunteer-application': volunteerApplication,
  'artist-application': artistApplication,
  'sponsor-inquiry': sponsorInquiry,
  'contact': contactForm,
};

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const formType = event.pathParameters?.proxy;
    if (!formType) return errResponse(400, 'Missing form type');

    const route = ROUTES[formType];
    if (!route) return errResponse(404, `Unknown form type: ${formType}`);

    const data = parseBody(event);
    return route(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    console.error('Forms handler error:', e);
    if (message === 'Missing request body' || message === 'Invalid JSON body') {
      return errResponse(400, message);
    }
    return errResponse(500, 'Internal server error');
  }
};
