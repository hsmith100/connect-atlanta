import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { appendToSheet } from '../lib/sheets';
import type {
  EmailSignupPayload,
  ContactFormPayload,
  VolunteerApplicationPayload,
  VendorApplicationPayload,
  ArtistApplicationPayload,
  SponsorInquiryPayload,
} from '../../../shared/types/forms';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESClient({ region: 'us-east-1' });

const TABLES = {
  emailSignups: process.env.EMAIL_SIGNUPS_TABLE!,
  vendorApplications: process.env.VENDOR_APPLICATIONS_TABLE!,
  volunteerApplications: process.env.VOLUNTEER_APPLICATIONS_TABLE!,
  artistApplications: process.env.ARTIST_APPLICATIONS_TABLE!,
  sponsorInquiries: process.env.SPONSOR_INQUIRIES_TABLE!,
};

const SHEETS = {
  vendorApplications: process.env.VENDOR_SHEET_ID ?? '',
  volunteerApplications: process.env.VOLUNTEER_SHEET_ID ?? '',
  artistApplications: process.env.ARTIST_SHEET_ID ?? '',
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
    return JSON.parse(event.body) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function newItem(): { id: string; status: string; createdAt: string } {
  return { id: randomUUID(), status: 'pending', createdAt: new Date().toISOString() };
}

// Fire-and-forget Sheets sync — failure never blocks the form submission
async function syncToSheet(spreadsheetId: string, row: (string | number | boolean | null)[]): Promise<void> {
  if (!spreadsheetId) return;
  try {
    await appendToSheet(spreadsheetId, row);
  } catch (e) {
    console.warn('Sheets sync failed (non-fatal):', e);
  }
}

function timestamp(): string {
  return new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
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
    console.warn('SES send failed (non-fatal):', e);
  }
}

/**
 * Validates required fields on a raw payload and narrows it to type T.
 * Returns a discriminated union — check `result.ok` before accessing `result.data`.
 */
function parsePayload<T>(
  raw: Record<string, unknown>,
  requiredFields: (keyof T & string)[],
): { ok: true; data: T } | { ok: false; err: APIGatewayProxyResultV2 } {
  for (const field of requiredFields) {
    if (!raw[field]) return { ok: false, err: errResponse(400, `${field} is required`) };
  }
  return { ok: true, data: raw as unknown as T };
}

// ── Form handlers ────────────────────────────────────────────────────────────

async function emailSignup(raw: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const result = parsePayload<EmailSignupPayload>(raw, ['name', 'email']);
  if (!result.ok) return result.err;
  const data = result.data;

  const marketingConsent = raw.marketingConsent ?? raw.marketing_consent ?? false;

  const item = {
    ...newItem(),
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    marketingConsent,
    source: data.source ?? 'website',
  };

  await ddb.send(new PutCommand({ TableName: TABLES.emailSignups, Item: item }));

  return created({
    success: true,
    message: "Thank you for signing up! We'll keep you updated on upcoming events.",
    id: item.id,
    createdAt: item.createdAt,
  });
}

async function vendorApplication(raw: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const result = parsePayload<VendorApplicationPayload>(raw, [
    'businessName', 'contactName', 'email', 'phone', 'businessType',
    'description', 'websiteSocial', 'pricePoint', 'hasInsurance', 'foodPermit', 'setup',
  ]);
  if (!result.ok) return result.err;
  const data = result.data;

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

  // Sync to Google Sheet — columns match existing form response sheet
  // Internal review columns (Alumni, C, S, E, I, AFRD, P, T1, T2, R) left blank for team to fill
  await syncToSheet(SHEETS.vendorApplications, [
    timestamp(),       // A: Timestamp
    '', '', '', '', '', '', '', '', '', '', // B-K: Internal review columns
    data.businessName,    // L: Store Name
    data.contactName,     // M: Owner's Full Name
    data.businessType,    // N: What kind of business
    data.description,     // O: Description of what you're selling
    data.websiteSocial,   // P: Website or Social Media Links
    data.pricePoint,      // Q: Average Price Point
    data.hasInsurance,    // R: Does your business have insurance?
    '',                   // S: Is this business a registered entity? (not collected)
    data.email,           // T: Email
    data.phone,           // U: Phone Number
    data.additionalComments ?? '', // V: Additional Comments
    data.description,     // W: Brief description
    data.foodPermit,      // X: Food service permit
    data.setup,           // Y: Setup
    '', '',               // Z, AA: empty / Do you have permits (not collected)
    '',                   // AB: Internal Notes
  ]);

  return created({
    success: true,
    message: "Thank you for your vendor application! We'll review it and get back to you soon.",
    id: item.id,
    createdAt: item.createdAt,
  });
}

async function volunteerApplication(raw: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const result = parsePayload<VolunteerApplicationPayload>(raw, ['firstName', 'lastName', 'email', 'phone']);
  if (!result.ok) return result.err;
  const data = result.data;

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

  // Sync to Google Sheet
  await syncToSheet(SHEETS.volunteerApplications, [
    timestamp(),                    // A: Timestamp
    data.firstName,                 // B: First Name
    data.lastName,                  // C: Last Name
    data.email,                     // D: Email
    data.phone,                     // E: Phone Number
    data.experience ?? '',          // F: Event Experience
    Array.isArray(data.skills) ? data.skills.join(', ') : '', // G: I am interested in
  ]);

  return created({
    success: true,
    message: "Thank you for volunteering! We'll be in touch with next steps.",
    id: item.id,
    createdAt: item.createdAt,
  });
}

async function artistApplication(raw: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const result = parsePayload<ArtistApplicationPayload>(raw, [
    'email', 'fullLegalName', 'djName', 'city', 'phone', 'instagramLink',
    'contactMethod', 'mainGenre', 'subGenre', 'livePerformanceLinks',
    'soundcloudLink', 'spotifyLink', 'rekordboxFamiliar',
  ]);
  if (!result.ok) return result.err;
  const data = result.data;

  const item = {
    ...newItem(),
    email: data.email,
    fullLegalName: data.fullLegalName,
    djName: data.djName,
    city: data.city,
    phone: data.phone,
    instagramLink: data.instagramLink,
    contactMethod: data.contactMethod,
    artistBio: data.artistBio || null,
    b2bFavorite: data.b2bFavorite || null,
    mainGenre: data.mainGenre,
    subGenre: data.subGenre,
    otherSubGenre: data.otherSubGenre ?? null,
    otherGenreText: data.otherGenreText ?? null,
    livePerformanceLinks: data.livePerformanceLinks,
    soundcloudLink: data.soundcloudLink,
    spotifyLink: data.spotifyLink,
    rekordboxFamiliar: data.rekordboxFamiliar,
    promoKitLinks: data.promoKitLinks ?? null,
    additionalInfo: data.additionalInfo ?? null,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.artistApplications, Item: item }));

  // Sync to Google Sheet — RATING and NOTES left blank for team to fill
  await syncToSheet(SHEETS.artistApplications, [
    timestamp(),                          // A: Timestamp
    '',                                   // B: RATING (team fills manually)
    data.djName,                          // C: DJ Name / Alias
    data.email,                           // D: Email Address
    data.mainGenre,                       // E: Main Genre
    '',                                   // F: What Other Genres (not collected)
    data.artistBio ?? '',                 // G: Tell us about you
    data.b2bFavorite ?? '',               // H: Favorite B2B
    data.spotifyLink,                     // I: Spotify Link
    data.email,                           // J: Email (duplicate column in sheet)
    data.instagramLink,                   // K: Instagram Link
    data.phone,                           // L: Phone number
    data.rekordboxFamiliar,               // M: Familiar with Rekordbox?
    data.contactMethod,                   // N: Best way to contact
    data.promoKitLinks ?? '',             // O: Promo / Press Kits
    '',                                   // P: EPK upload (file, not collected)
    data.additionalInfo ?? '',            // Q: Anything else
    data.city,                            // R: City
    data.subGenre,                        // S: Sub Genre
    data.otherSubGenre ?? '',             // T: Other Sub Genre
    data.livePerformanceLinks,            // U: Live performance links
    data.soundcloudLink,                  // V: Soundcloud
    data.otherGenreText ?? '',            // W: Other genre text
    data.fullLegalName,                   // X: Full legal name
    '', '',                               // Y, Z: Column 20, Upload (not collected)
    '', '',                               // AA, AB: NOTES, EXPORTED TO DATABASE
  ]);

  return created({
    success: true,
    message: "Thank you for your artist application! We'll review your submission and contact you soon.",
    id: item.id,
    createdAt: item.createdAt,
  });
}

async function sponsorInquiry(raw: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const result = parsePayload<SponsorInquiryPayload>(raw, ['name', 'email', 'phone', 'company', 'productIndustry']);
  if (!result.ok) return result.err;
  const data = result.data;

  const item = {
    ...newItem(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    productIndustry: data.productIndustry,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.sponsorInquiries, Item: item }));

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

async function contactForm(raw: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const result = parsePayload<ContactFormPayload>(raw, ['name', 'email', 'subject', 'message']);
  if (!result.ok) return result.err;
  const data = result.data;

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
