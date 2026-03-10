import { test, expect } from '@playwright/test';

const pages = [
  { route: '/', heading: 'Home of Beats on the Beltline' },
  { route: '/events', heading: 'Events' },
  { route: '/join', heading: 'Join Us' },
  { route: '/contact', heading: 'Contact Us' },
  { route: '/sponsor-inquiries', heading: 'Sponsor Inquiries' },
  { route: '/merch', heading: 'Merch' },
];

for (const { route, heading } of pages) {
  test(`${route} — heading visible`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(route);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();

    expect(errors, `JS errors on ${route}: ${errors.join(', ')}`).toHaveLength(0);
  });
}
