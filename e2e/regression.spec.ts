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
    // On mobile the desktop nav is hidden — open the hamburger menu first.
    const openNavIfMobile = async () => {
      if ((page.viewportSize()?.width ?? 1280) < 768) {
        await page.getByRole('button', { name: 'Toggle mobile menu' }).click();
      }
    };

    await page.goto('/');
    await openNavIfMobile();
    await page.getByRole('link', { name: 'Events' }).first().click();
    await expect(page).toHaveURL(/\/events/);
    await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();

    await openNavIfMobile();
    await page.getByRole('link', { name: 'Join Us' }).first().click();
    await expect(page).toHaveURL(/\/join/);
    await expect(page.getByRole('heading', { name: 'Join Us', exact: true })).toBeVisible();

    await openNavIfMobile();
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

// ── Form validation ───────────────────────────────────────────────────────────

test.describe('contact form validation', () => {
  test('does not submit when required fields are empty', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: /send message/i }).click();
    // HTML5 required validation blocks submission — form stays visible, no success message
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByText(/message sent/i)).not.toBeVisible();
  });
});

test.describe('DJ application form validation', () => {
  test('does not submit when required fields are empty', async ({ page }) => {
    await page.goto('/join');
    await page.getByRole('button', { name: /submit dj application/i }).click();
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    await expect(page.getByText(/application submitted/i)).not.toBeVisible();
  });
});

// ── Home page — hero logo ─────────────────────────────────────────────────────

test.describe('home page logo', () => {
  test('hero logo is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('img[alt="Beats on the Block logo"]')).toBeVisible();
  });
});

// ── Footer ────────────────────────────────────────────────────────────────────

test.describe('footer', () => {
  test('renders logo, copyright, and social links on home page', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer.locator('img[alt="botb logo"]')).toBeVisible();
    await expect(footer.getByText(/Copyright 2025 Connect Events/)).toBeVisible();
    await expect(footer.getByLabel('Instagram')).toBeVisible();
    await expect(footer.getByLabel('Facebook')).toBeVisible();
    await expect(footer.getByLabel('YouTube')).toBeVisible();
    await expect(footer.getByLabel('TikTok')).toBeVisible();
  });
});

// ── Merch page ────────────────────────────────────────────────────────────────

test.describe('merch page', () => {
  test('shop button links to external store', async ({ page }) => {
    await page.goto('/merch');
    const shopButton = page.getByRole('link', { name: /shop all on bonfire/i });
    await expect(shopButton).toBeVisible();
    await expect(shopButton).toHaveAttribute('href', expect.stringContaining('bonfire.com'));
  });
});

// ── Secret lineup page ────────────────────────────────────────────────────────

test.describe('secret lineup page', () => {
  test('AHS logo is visible', async ({ page }) => {
    await page.goto('/secret-lineup');
    await expect(page.getByAltText('Presented by Advanced Health Solutions')).toBeVisible();
  });

  test('sponsor blurb content is present', async ({ page }) => {
    await page.goto('/secret-lineup');
    await expect(page.getByText(/thrilled to partner with Advanced Health Solutions/i)).toBeVisible();
    await expect(page.getByText(/zero out of pocket costs/i)).toBeVisible();
  });

  test('AHS link points to ahsdoctors.com and opens in a new tab', async ({ page }) => {
    await page.goto('/secret-lineup');
    const link = page.getByRole('link', { name: /visit advanced health solutions/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://ahsdoctors.com');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });

  test('lineup image is visible', async ({ page }) => {
    await page.goto('/secret-lineup');
    await expect(page.getByAltText(/official beats on the block.*performer lineup/i)).toBeVisible();
  });

  test('page is tagged noindex', async ({ page }) => {
    await page.goto('/secret-lineup');
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });

  test('/secret-lineup does not appear in site navigation', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('header a[href*="secret-lineup"]');
    await expect(navLinks).toHaveCount(0);
  });
});

// ── Admin page ────────────────────────────────────────────────────────────────

test.describe('admin page', () => {
  test('shows auth gate when not authenticated', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Admin Login')).toBeVisible();
    await expect(page.getByPlaceholder('Admin key')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('sign in button is disabled until a key is entered', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeDisabled();
    await page.getByPlaceholder('Admin key').fill('any-key');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled();
  });
});
