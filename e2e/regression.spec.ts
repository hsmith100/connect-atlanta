import { test, expect } from '@playwright/test';
import { CORE_PAGES } from './types/pages';
import { registerPageChecks } from './helpers/page-checks';

// ── Core page checks (headings visible, no JS errors) ────────────────────────

registerPageChecks(CORE_PAGES);

// ── Home page — hero cards ────────────────────────────────────────────────────

test.describe('home page', () => {
  test('hero cards load from API', async ({ page }) => {
    await page.goto('/');
    // Cards are only rendered after the API responds — waiting for one
    // implicitly confirms the load succeeded. Assumes at least one card
    // exists in DynamoDB (true for staging and production).
    await expect(page.locator('.hero-card-title').first()).toBeVisible({ timeout: 10000 });
  });
});

// ── Navigation ───────────────────────────────────────────────────────────────

test.describe('navigation', () => {
  test('nav links route to the correct pages', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Events' }).first().click();
    await expect(page).toHaveURL(/\/events/);
    await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Join Us' }).first().click();
    await expect(page).toHaveURL(/\/join/);
    await expect(page.getByRole('heading', { name: 'Join Us', exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Contact' }).first().click();
    await expect(page).toHaveURL(/\/contact/);
    await expect(page.getByRole('heading', { name: 'Contact Us', exact: true })).toBeVisible();
  });
});

// ── Gallery page — photos ─────────────────────────────────────────────────────

test.describe('gallery page', () => {
  test('photos load from API without error', async ({ page }) => {
    await page.goto('/gallery');
    await expect(page.getByText('Loading gallery...')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Could not load gallery. Please try again later.')).not.toBeVisible();
    // Assumes at least one photo exists in DynamoDB (true for staging and production)
    await expect(page.locator('img[alt^="Gallery photo"]').first()).toBeVisible();
  });
});

// ── Events page — API response ────────────────────────────────────────────────

test.describe('events page', () => {
  test('events load from API without error', async ({ page }) => {
    await page.goto('/events');
    // Wait for loading spinner to clear (up to 10s for Lambda cold start)
    await expect(page.getByText('Loading events...').first()).not.toBeVisible({ timeout: 10000 });
    // Assert no error banner
    await expect(page.getByText('Failed to load events. Please try again later.')).not.toBeVisible();
  });
});

// ── Forms ─────────────────────────────────────────────────────────────────────

test.describe('contact form', () => {
  test('all required fields are present and enabled', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByPlaceholder('Your name')).toBeEnabled();
    await expect(page.getByPlaceholder('your@email.com').first()).toBeEnabled();
    await expect(page.getByPlaceholder("What's this about?")).toBeEnabled();
    await expect(page.getByPlaceholder("Tell us what's on your mind...")).toBeEnabled();
    await expect(page.getByRole('button', { name: /send message/i })).toBeEnabled();
  });
});

test.describe('email signup form', () => {
  test('all required fields are present and enabled', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByPlaceholder('Your full name')).toBeEnabled();
    await expect(page.getByPlaceholder('your.email@example.com')).toBeEnabled();
    await expect(page.getByPlaceholder('(555) 123-4567')).toBeEnabled();
    await expect(page.getByRole('checkbox')).toBeEnabled();
    await expect(page.getByRole('button', { name: /sign up for updates/i })).toBeEnabled();
  });
});

test.describe('home page signup form', () => {
  test('all required fields are present and enabled', async ({ page }) => {
    await page.goto('/');
    // ConnectSection uses explicit IDs — scope tightly to avoid matching the modal
    await expect(page.locator('#name')).toBeEnabled();
    await expect(page.locator('#email')).toBeEnabled();
    await expect(page.locator('#phone')).toBeEnabled();
    await expect(page.locator('#marketing-consent')).toBeEnabled();
    await expect(page.getByRole('button', { name: /connect with us/i })).toBeEnabled();
  });
});

test.describe('connect modal', () => {
  test('opens and all required fields are present and enabled', async ({ page }) => {
    await page.goto('/events');
    // "Get Connected" CTA is always rendered at the bottom of the events page
    await page.getByRole('button', { name: /get connected/i }).click();
    // Modal uses explicit IDs — safe to target directly
    await expect(page.locator('#modal-name')).toBeEnabled();
    await expect(page.locator('#modal-email')).toBeEnabled();
    await expect(page.locator('#modal-marketing-consent')).toBeEnabled();
    await expect(page.getByRole('button', { name: /connect with us/i })).toBeEnabled();
  });
});

test.describe('sponsor inquiry form', () => {
  test('all required fields are present and enabled', async ({ page }) => {
    await page.goto('/sponsor-inquiries');
    await expect(page.getByPlaceholder('Your full name')).toBeEnabled();
    await expect(page.getByPlaceholder('your@email.com')).toBeEnabled();
    await expect(page.getByPlaceholder('(555) 123-4567')).toBeEnabled();
    await expect(page.getByPlaceholder('Your company name')).toBeEnabled();
    await expect(page.getByPlaceholder('Tell us about your product or industry...')).toBeEnabled();
    await expect(page.getByRole('button', { name: /submit inquiry/i })).toBeEnabled();
  });
});

test.describe('DJ application form', () => {
  test('all required fields are present and enabled', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByPlaceholder('your@email.com')).toBeEnabled();
    await expect(page.getByPlaceholder('Your full legal name')).toBeEnabled();
    await expect(page.getByPlaceholder('Your DJ/Artist name')).toBeEnabled();
    await expect(page.getByPlaceholder('City name')).toBeEnabled();
    await expect(page.getByPlaceholder('(555) 123-4567')).toBeEnabled();
    await expect(page.getByRole('button', { name: /submit dj application/i })).toBeEnabled();
  });
});
