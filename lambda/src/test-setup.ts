// Sets env vars before any module is loaded, so module-level constants
// (TABLES, EVENTS_TABLE, etc.) are captured with test values.
process.env.EMAIL_SIGNUPS_TABLE = 'test-email-signups';
process.env.ARTIST_APPLICATIONS_TABLE = 'test-artist-applications';
process.env.SPONSOR_INQUIRIES_TABLE = 'test-sponsor-inquiries';
process.env.EVENTS_TABLE = 'test-events';
process.env.PHOTOS_TABLE = 'test-photos';
process.env.MEDIA_BUCKET = 'test-media-bucket';
process.env.CLOUDFRONT_DOMAIN = 'media.test';
process.env.ADMIN_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:test-admin';
process.env.TURNSTILE_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:test-turnstile';
process.env.CONTACT_EMAIL = 'contact@test.com';
process.env.FROM_EMAIL = 'noreply@test.com';
process.env.STORE_COLLECTIONS_TABLE = 'test-store-collections';
process.env.STORE_PHOTOS_TABLE = 'test-store-photos';
process.env.STORE_PHOTOGRAPHERS_TABLE = 'test-store-photographers';
process.env.STORE_ORDERS_TABLE = 'test-store-orders';
process.env.ORIGINALS_BUCKET = 'test-originals-bucket';
process.env.STRIPE_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:test-stripe';
process.env.SITE_ORIGIN_MODE = 'any-cloudfront';
