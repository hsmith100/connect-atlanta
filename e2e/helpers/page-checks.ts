import { test, expect } from '@playwright/test';
import { type Page } from '../types/pages';

export function registerPageChecks(pages: Page[]) {
  for (const { route, heading } of pages) {
    test(`${route} — heading visible`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(route);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();

      expect(errors, `JS errors on ${route}: ${errors.join(', ')}`).toHaveLength(0);
    });
  }
}
