# E2E Testing Reference

Playwright end-to-end tests for Connect Atlanta / Beats on the Block.

## Test Suites

| Suite | File | Runs against | Blocks |
|---|---|---|---|
| **Regression** | `e2e/regression.spec.ts` | Dev (PRs) + Staging (prod pipeline) | Merging PRs + prod deploy |
| **Smoke** | `e2e/smoke.spec.ts` | Production | Nothing (post-deploy sanity) |

Both suites are semantically separate so regression can grow independently while smoke stays minimal.

## Current Coverage

6 pages × 3 browsers (Chromium, Firefox, WebKit):

| Route | Assertion |
|---|---|
| `/` | `"Home of Beats on the Block"` heading visible |
| `/events` | `"Events"` heading visible |
| `/join` | `"Join Us"` heading visible |
| `/contact` | `"Contact Us"` heading visible |
| `/sponsor-inquiries` | `"Sponsor Inquiries"` heading visible |
| `/merch` | `"Merch"` heading visible |

Each test also asserts zero JS `pageerror` events.

## Local Setup

```bash
cd e2e
npm install
npx playwright install   # downloads browser binaries (~300 MB)
```

## Running Locally

```bash
# Against dev
BASE_URL=https://d2gqwwd1lyhnar.cloudfront.net npx playwright test regression.spec.ts

# Against staging
BASE_URL=https://d36pa7dr4nksf5.cloudfront.net npx playwright test regression.spec.ts

# Against production
BASE_URL=https://connectevents.co npx playwright test smoke.spec.ts

# Single browser
BASE_URL=https://connectevents.co npx playwright test smoke.spec.ts --project=chromium

# Headed (watch the browser)
BASE_URL=https://connectevents.co npx playwright test smoke.spec.ts --headed
```

## CI Flow

### PR pipeline (`pr.yml`)

```
quality-checks → synth + build-frontend → deploy-dev → automation-tests
                                                         (regression vs dev)
```

`automation-tests / regression-tests` is a required status check on `main`. PRs cannot merge until it passes.

### Production pipeline (`production.yml`)

```
quality-checks → synth + build-frontend → deploy-staging → regression-tests (vs staging)
                                                                   ↓
                                                          deploy-production → post-deploy-smoke (vs prod)
```

Regression gates the production deploy. Smoke runs after and is informational (does not block a rollback).

## Adding Tests to Regression

Add new `test()` blocks to `e2e/regression.spec.ts`. Keep `smoke.spec.ts` minimal — only add to smoke if you want every prod deploy verified against that page.

Example:

```ts
test('/gallery — gallery heading visible', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/gallery');
  await expect(page.getByRole('heading', { name: 'Gallery' })).toBeVisible();

  expect(errors, `JS errors on /gallery`).toHaveLength(0);
});
```

## Browser Matrix

Defined in `e2e/playwright.config.ts`:

- `chromium` — Desktop Chrome
- `firefox` — Desktop Firefox
- `webkit` — Desktop Safari

No mobile viewports in the initial pass. Add a `projects` entry to extend.
