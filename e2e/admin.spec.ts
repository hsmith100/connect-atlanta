// Admin CRUD regression tests.
//
// Each suite exercises a full create → edit → delete lifecycle against the live
// admin UI, plus a save-order path where applicable. All created items use
// "E2E Test" in their names so the global teardown can identify and remove
// anything that leaks through if a test fails before the UI cleanup step.
//
// Requires: ADMIN_KEY env var. Playwright storageState written by admin-setup.ts
// pre-seeds localStorage so the AuthGate is bypassed on every test.

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { deleteTestEvents, deleteTestHeroCards, deletePhotosById } from './helpers/admin-api';

const TEST_IMAGE = path.join(__dirname, 'fixtures/test-image.png');
const PHOTO_STATE_FILE = path.join(__dirname, '.test-state', 'photo-ids.json');

function recordPhotoIds(ids: string[]): void {
  fs.mkdirSync(path.dirname(PHOTO_STATE_FILE), { recursive: true });
  const existing: string[] = fs.existsSync(PHOTO_STATE_FILE)
    ? JSON.parse(fs.readFileSync(PHOTO_STATE_FILE, 'utf-8'))
    : [];
  const merged = [...new Set([...existing, ...ids])];
  fs.writeFileSync(PHOTO_STATE_FILE, JSON.stringify(merged));
}

// ── Events ────────────────────────────────────────────────────────────────────

test.describe('admin — events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Events' }).click();
  });

  test.afterEach(async () => {
    await deleteTestEvents().catch(console.error);
  });

  test('create with flyer, edit, and delete', async ({ page }) => {
    // ── Create ──────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Add Event' }).click();
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();

    await page.getByPlaceholder('Beats on the Beltline').fill('E2E Test Event');
    await page.locator('input[type="date"]').fill('2099-01-01');

    // Attach flyer — presign → S3 PUT → createEvent with flyerUrl
    const flyerInput = page.locator('div[class*="bg-gray-900"][class*="rounded-xl"] input[type="file"]');
    await flyerInput.setInputFiles(TEST_IMAGE);
    await expect(page.locator('img[alt="Flyer preview"]')).toBeVisible();

    await page.getByRole('button', { name: 'Create Event' }).click();
    await expect(page.getByText('"E2E Test Event" created.')).toBeVisible({ timeout: 30000 });

    // Event card appears with flyer image (not the "No flyer" placeholder)
    const eventCard = page.locator('div.bg-gray-900.rounded-xl').filter({ hasText: 'E2E Test Event' });
    await expect(eventCard).toBeVisible();
    await expect(eventCard.getByText('No flyer')).not.toBeVisible();

    // ── Edit ────────────────────────────────────────────────────────────────
    await eventCard.getByTitle('Edit event').click();
    await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible();

    await page.getByPlaceholder('Beats on the Beltline').clear();
    await page.getByPlaceholder('Beats on the Beltline').fill('E2E Test Event - Edited');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('"E2E Test Event - Edited" updated.')).toBeVisible({ timeout: 15000 });

    const editedCard = page.locator('div.bg-gray-900.rounded-xl').filter({ hasText: 'E2E Test Event - Edited' });
    await expect(editedCard).toBeVisible();

    // ── Delete ───────────────────────────────────────────────────────────────
    // deleteEventById also removes the flyer from S3 — exercises that path.
    page.once('dialog', (d) => d.accept());
    await editedCard.getByTitle('Delete event').click();
    await expect(page.getByText('"E2E Test Event - Edited" deleted.')).toBeVisible({ timeout: 15000 });
    await expect(editedCard).not.toBeVisible();
  });
});

// ── Hero Cards ────────────────────────────────────────────────────────────────

test.describe('admin — hero cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Hero Cards' }).click();
  });

  test.afterEach(async () => {
    await deleteTestHeroCards().catch(console.error);
  });

  test('create with image, edit, and delete', async ({ page }) => {
    // ── Create ──────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Add Card' }).click();
    await expect(page.getByRole('heading', { name: 'New Card' })).toBeVisible();

    await page.getByPlaceholder('Beats on the Beltline').fill('E2E Test Card');
    await page.getByPlaceholder("Atlanta's premier free outdoor electronic music experience…").fill('Test description');
    await page.getByPlaceholder('Attend Next Event').fill('Learn More');
    await page.getByPlaceholder('/join or https://...').fill('/events');

    // Attach image — presign → S3 PUT → createHeroCard with imageUrl
    const imageInput = page.locator('div[class*="bg-gray-900"][class*="rounded-xl"] input[type="file"]');
    await imageInput.setInputFiles(TEST_IMAGE);
    await expect(page.locator('img[alt="Preview"]')).toBeVisible();

    await page.getByRole('button', { name: 'Create Card' }).click();
    await expect(page.getByText('Card "E2E Test Card" created.')).toBeVisible({ timeout: 30000 });

    // Card appears in the list
    const card = page.locator('div.w-72').filter({ hasText: 'E2E Test Card' });
    await expect(card).toBeVisible();

    // ── Edit ────────────────────────────────────────────────────────────────
    await card.getByTitle('Edit card').click();
    await expect(page.getByRole('heading', { name: 'Edit Card' })).toBeVisible();

    await page.getByPlaceholder('Beats on the Beltline').clear();
    await page.getByPlaceholder('Beats on the Beltline').fill('E2E Test Card - Edited');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Card "E2E Test Card - Edited" updated.')).toBeVisible({ timeout: 15000 });

    const editedCard = page.locator('div.w-72').filter({ hasText: 'E2E Test Card - Edited' });
    await expect(editedCard).toBeVisible();

    // ── Delete ───────────────────────────────────────────────────────────────
    // deleteHeroCard also removes the image from S3 — exercises that path.
    page.once('dialog', (d) => d.accept());
    await editedCard.getByTitle('Delete card').click();
    await expect(page.getByText('"E2E Test Card - Edited" deleted.')).toBeVisible({ timeout: 15000 });
    await expect(editedCard).not.toBeVisible();
  });

  test('save order', async ({ page }) => {
    // ── Create two cards ────────────────────────────────────────────────────
    for (const name of ['E2E Order Card A', 'E2E Order Card B']) {
      await page.getByRole('button', { name: 'Add Card' }).click();
      await expect(page.getByRole('heading', { name: 'New Card' })).toBeVisible();
      await page.getByPlaceholder('Beats on the Beltline').fill(name);
      await page.getByPlaceholder("Atlanta's premier free outdoor electronic music experience…").fill('Test');
      await page.getByPlaceholder('Attend Next Event').fill('Go');
      await page.getByPlaceholder('/join or https://...').fill('/events');
      await page.getByRole('button', { name: 'Create Card' }).click();
      await expect(page.getByText(`Card "${name}" created.`)).toBeVisible({ timeout: 15000 });
    }

    // ── Save order ──────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Save order' }).click();
    await expect(page.getByText('Order saved.')).toBeVisible({ timeout: 15000 });

    // ── Delete both ─────────────────────────────────────────────────────────
    for (const name of ['E2E Order Card A', 'E2E Order Card B']) {
      const c = page.locator('div.w-72').filter({ hasText: name });
      page.once('dialog', (d) => d.accept());
      await c.getByTitle('Delete card').click();
      await expect(page.getByText(`"${name}" deleted.`)).toBeVisible({ timeout: 15000 });
    }
  });
});

// ── Photos ────────────────────────────────────────────────────────────────────

test.describe('admin — photos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Photos' }).click();
  });

  test('upload (full flow), save order, and delete', async ({ page }) => {
    // Record existing photo IDs so we can identify the newly uploaded ones
    const idsBefore = await page
      .locator('[data-photo-id]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-photo-id') as string));

    // ── Upload two photos ───────────────────────────────────────────────────
    // Full flow: presignPhotos → generateThumbnail (Canvas) → S3 PUT (photo + thumb) → createPhotos
    await page.locator('input[type="file"]').setInputFiles([TEST_IMAGE, TEST_IMAGE]);
    await expect(page.getByText('Uploaded 2 photo(s).')).toBeVisible({ timeout: 30000 });

    await expect(page.locator('[data-photo-id]')).toHaveCount(idsBefore.length + 2, { timeout: 10000 });

    const idsAfter = await page
      .locator('[data-photo-id]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-photo-id') as string));
    const newIds = idsAfter.filter((id) => !idsBefore.includes(id));

    // Record for global teardown safety net
    recordPhotoIds(newIds);

    // ── Save order ──────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Save order' }).click();
    await expect(page.getByText('Order saved.')).toBeVisible({ timeout: 15000 });

    // ── Delete both photos ──────────────────────────────────────────────────
    // deletePhotos removes both the DynamoDB record and the S3 objects (photo + thumb)
    for (const id of newIds) {
      const photoCard = page.locator(`[data-photo-id="${id}"]`);
      await photoCard.locator('input[type="checkbox"]').check();
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: /^Delete \(1\)/ }).click();
      await expect(page.getByText('Deleted 1 photo(s).')).toBeVisible({ timeout: 15000 });
    }

    // Verify both are gone
    for (const id of newIds) {
      await expect(page.locator(`[data-photo-id="${id}"]`)).not.toBeVisible();
    }
  });
});
