import { PutCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import type {
  EmailSignupPayload,
  ContactFormPayload,
  ArtistApplicationPayload,
  SponsorInquiryPayload,
} from '../../../shared/types/forms';
import { ddb, TABLES, created, parsePayload, newItem, sendEmail, sendConfirmationEmail, type FormPayload } from '../lib/formShared';

async function emailSignup(raw: FormPayload): Promise<APIGatewayProxyResultV2> {
  const result = parsePayload<EmailSignupPayload>(raw, ['name', 'email']);
  if (!result.ok) return result.err;
  const data = result.data;

  const item = {
    ...newItem(),
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    marketingConsent: raw.marketingConsent ?? raw.marketing_consent ?? false,
    source: data.source ?? 'website',
  };

  await ddb.send(new PutCommand({ TableName: TABLES.emailSignups, Item: item }));

  await sendConfirmationEmail(
    data.email,
    "You're on the list! — Beats on the Beltline",
    `Hi ${data.name},\n\nYou're officially on the Beats on the Beltline mailing list! 🎉\n\nWe'll reach out with updates on upcoming events, lineups, and more.\n\nSee you on the Beltline,\nThe Connect Team\nconnectevents.co`,
  );

  return created({
    success: true,
    message: "Thank you for signing up! We'll keep you updated on upcoming events.",
    id: item.id,
    createdAt: item.createdAt,
  });
}

async function artistApplication(raw: FormPayload): Promise<APIGatewayProxyResultV2> {
  const result = parsePayload<ArtistApplicationPayload>(raw, [
    'email', 'fullLegalName', 'djName', 'city', 'phone', 'instagramLink',
    'contactMethod', 'mainGenre', 'subGenre', 'rekordboxFamiliar',
  ]);
  if (!result.ok) return result.err;
  const data = result.data;

  // Upsert by email — update existing record if email already on file
  const existing = await ddb.send(new ScanCommand({
    TableName: TABLES.artistApplications,
    FilterExpression: 'email = :e',
    ExpressionAttributeValues: { ':e': data.email },
    Limit: 1,
  }));

  if (existing.Items?.length) {
    const existingId = existing.Items[0].id as string;
    await ddb.send(new UpdateCommand({
      TableName: TABLES.artistApplications,
      Key: { id: existingId },
      UpdateExpression: [
        'SET fullLegalName = :fln, djName = :djn, city = :c, phone = :p,',
        'instagramLink = :ig, contactMethod = :cm, artistBio = :ab,',
        'b2bFavorite = :b2b, mainGenre = :mg, subGenre = :sg,',
        'otherSubGenre = :osg, otherGenreText = :ogt,',
        'livePerformanceLinks = :lpl, soundcloudLink = :sc,',
        'spotifyLink = :sp, rekordboxFamiliar = :rf,',
        'promoKitLinks = :pkl, additionalInfo = :ai, updatedAt = :ua',
      ].join(' '),
      ExpressionAttributeValues: {
        ':fln': data.fullLegalName,
        ':djn': data.djName,
        ':c': data.city,
        ':p': data.phone,
        ':ig': data.instagramLink,
        ':cm': data.contactMethod,
        ':ab': data.artistBio || null,
        ':b2b': data.b2bFavorite || null,
        ':mg': data.mainGenre,
        ':sg': data.subGenre,
        ':osg': data.otherSubGenre ?? null,
        ':ogt': data.otherGenreText ?? null,
        ':lpl': data.livePerformanceLinks,
        ':sc': data.soundcloudLink,
        ':sp': data.spotifyLink,
        ':rf': data.rekordboxFamiliar,
        ':pkl': data.promoKitLinks ?? null,
        ':ai': data.additionalInfo ?? null,
        ':ua': new Date().toISOString(),
      },
    }));

    await sendConfirmationEmail(
      data.email,
      'DJ Application Updated — Beats on the Beltline',
      `Hi ${data.djName},\n\nWe've received your updated DJ application for Beats on the Beltline.\n\nOur booking team reviews all applications and will reach out if there's a match for an upcoming event.\n\nThank you for your continued interest!\n\nThe Connect Team\nconnectevents.co`,
    );

    return created({
      success: true,
      message: "Your application has been updated. We'll review your submission and contact you soon.",
      id: existingId,
    });
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

  await sendConfirmationEmail(
    data.email,
    'DJ Application Received — Beats on the Beltline',
    `Hi ${data.djName},\n\nWe've received your DJ application for Beats on the Beltline. Thank you for your interest!\n\nOur booking team reviews all applications and will reach out if there's a match for an upcoming event.\n\nThe Connect Team\nconnectevents.co`,
  );

  return created({
    success: true,
    message: "Thank you for your artist application! We'll review your submission and contact you soon.",
    id: item.id,
    createdAt: item.createdAt,
  });
}

async function sponsorInquiry(raw: FormPayload): Promise<APIGatewayProxyResultV2> {
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
    notes: '',
  };

  await ddb.send(new PutCommand({ TableName: TABLES.sponsorInquiries, Item: item }));

  await sendEmail(
    `New Sponsor Inquiry from ${data.company}`,
    `New Sponsor Inquiry\n\nName: ${data.name}\nCompany: ${data.company}\nEmail: ${data.email}\nPhone: ${data.phone}\n\nProduct/Industry:\n${data.productIndustry}\n\nSubmitted via connectevents.co`,
  );

  await sendConfirmationEmail(
    data.email,
    'Sponsorship Inquiry Received — Beats on the Beltline',
    `Hi ${data.name},\n\nThank you for your interest in sponsoring Beats on the Beltline!\n\nWe've received your inquiry and a member of our team will be in touch with you soon to discuss partnership opportunities.\n\nThe Connect Team\nconnectevents.co`,
  );

  return created({
    success: true,
    message: "Thank you for your interest in sponsoring! A team member will reach out to you soon.",
    id: item.id,
    createdAt: item.createdAt,
  });
}

async function contactForm(raw: FormPayload): Promise<APIGatewayProxyResultV2> {
  const result = parsePayload<ContactFormPayload>(raw, ['name', 'email', 'subject', 'message']);
  if (!result.ok) return result.err;
  const data = result.data;

  const item = {
    ...newItem(),
    name: data.name,
    email: data.email,
    source: 'contact-form',
    subject: data.subject,
    message: data.message,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.emailSignups, Item: item }));

  await sendEmail(
    `Contact Form: ${data.subject}`,
    `New Contact Form Submission\n\nFrom: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject}\n\nMessage:\n${data.message}\n\n---\nSent via connectevents.co`,
  );

  await sendConfirmationEmail(
    data.email,
    `Message Received — Beats on the Beltline`,
    `Hi ${data.name},\n\nWe've received your message and will get back to you soon.\n\nYour message:\n"${data.message}"\n\nThe Connect Team\nconnectevents.co`,
  );

  return created({
    success: true,
    message: "Message sent successfully! We'll get back to you soon.",
  });
}

export const FORM_ROUTES: Record<string, (data: FormPayload) => Promise<APIGatewayProxyResultV2>> = {
  'email-signup': emailSignup,
  'artist-application': artistApplication,
  'sponsor-inquiry': sponsorInquiry,
  'contact': contactForm,
};
