import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { appendToSheet } from '../lib/sheets';

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
    return JSON.parse(event.body);
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

// ── Form handlers ────────────────────────────────────────────────────────────

async function emailSignup(data: Record<string, unknown>): Promise<APIGatewayProxyResultV2> {
  const { name, email, phone, source } = data;
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

  // Sync to Google Sheet — columns match existing form response sheet
  // Internal review columns (Alumni, C, S, E, I, AFRD, P, T1, T2, R) left blank for team to fill
  void syncToSheet(SHEETS.vendorApplications, [
    timestamp(),       // A: Timestamp
    '', '', '', '', '', '', '', '', '', '', // B-K: Internal review columns
    data.businessName as string,    // L: Store Name
    data.contactName as string,     // M: Owner's Full Name
    data.businessType as string,    // N: What kind of business
    data.description as string,     // O: Description of what you're selling
    data.websiteSocial as string,   // P: Website or Social Media Links
    data.pricePoint as string,      // Q: Average Price Point
    data.hasInsurance as string,    // R: Does your business have insurance?
    '',                             // S: Is this business a registered entity? (not collected)
    data.email as string,           // T: Email
    data.phone as string,           // U: Phone Number
    (data.additionalComments as string) ?? '', // V: Additional Comments
    data.description as string,     // W: Brief description
    data.foodPermit as string,      // X: Food service permit
    data.setup as string,           // Y: Setup
    '', '',                         // Z, AA: empty / Do you have permits (not collected)
    '',                             // AB: Internal Notes
  ]);

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

  // Sync to Google Sheet
  void syncToSheet(SHEETS.volunteerApplications, [
    timestamp(),                    // A: Timestamp
    data.firstName as string,       // B: First Name
    data.lastName as string,        // C: Last Name
    data.email as string,           // D: Email
    data.phone as string,           // E: Phone Number
    (data.experience as string) ?? '',  // F: Event Experience
    Array.isArray(data.skills) ? data.skills.join(', ') : '', // G: I am interested in
  ]);

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

  // Sync to Google Sheet — RATING and NOTES left blank for team to fill
  void syncToSheet(SHEETS.artistApplications, [
    timestamp(),                          // A: Timestamp
    '',                                   // B: RATING (team fills manually)
    data.djName as string,               // C: DJ Name / Alias
    data.email as string,                // D: Email Address
    data.mainGenre as string,            // E: Main Genre
    '',                                   // F: What Other Genres (not collected)
    data.artistBio as string,            // G: Tell us about you
    data.b2bFavorite as string,          // H: Favorite B2B
    data.spotifyLink as string,          // I: Spotify Link
    data.email as string,                // J: Email (duplicate column in sheet)
    data.instagramLink as string,        // K: Instagram Link
    data.phone as string,                // L: Phone number
    data.rekordboxFamiliar as string,    // M: Familiar with Rekordbox?
    data.contactMethod as string,        // N: Best way to contact
    data.promoKitLinks as string,        // O: Promo / Press Kits
    '',                                   // P: EPK upload (file, not collected)
    (data.additionalInfo as string) ?? '', // Q: Anything else
    data.city as string,                 // R: City
    data.subGenre as string,             // S: Sub Genre
    (data.otherSubGenre as string) ?? '', // T: Other Sub Genre
    data.livePerformanceLinks as string, // U: Live performance links
    data.soundcloudLink as string,       // V: Soundcloud
    (data.otherGenreText as string) ?? '', // W: Other genre text
    data.fullLegalName as string,        // X: Full legal name
    '', '',                              // Y, Z: Column 20, Upload (not collected)
    '', '',                              // AA, AB: NOTES, EXPORTED TO DATABASE
  ]);

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
