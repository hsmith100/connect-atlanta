# Connect Atlanta

Event platform for [Beats on the Block](https://connectevents.co) — a recurring outdoor music event on the Atlanta Beltline.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (static export) → S3 + CloudFront |
| API | AWS API Gateway → Lambda (Node.js TypeScript) |
| Database | DynamoDB |
| Infrastructure | AWS CDK (TypeScript) |
| CI/CD | GitHub Actions (OIDC, no long-lived keys) |
| DNS | Route 53 + ACM |

## Repository Structure

```
connect-atlanta/
├── frontend/          # Next.js application
├── lambda/            # Lambda handlers (Node.js TypeScript)
├── infrastructure/    # AWS CDK stacks
├── data/              # Seed data
└── docs/              # Project documentation
```

## Environments

| Environment | URL | Purpose | Deploys on |
|---|---|---|---|
| Dev | https://d2gqwwd1lyhnar.cloudfront.net | Branch previews + local dev | PR open/update |
| Staging | https://d36pa7dr4nksf5.cloudfront.net | QA gate + admin playground | Push to `main` |
| Production | https://connectevents.co | Live site | After staging regression tests pass |

## Local Development

**Prerequisites:** Node.js 22, AWS CLI (authenticated)

```bash
# Install all dependencies
npm run install:all

# Start frontend dev server (proxies /api/* to dev API Gateway)
npm run dev --prefix frontend
```

The dev server proxies `/api/*` requests to the dev API Gateway URL configured in `frontend/.env.local` (`NEXT_PUBLIC_API_URL`). This file is gitignored — the current dev API URL is `https://xfsvqay2a7.execute-api.us-east-1.amazonaws.com`.

## CDK Stacks

| Stack | Description |
|---|---|
| `ConnectCiStack` | GitHub Actions OIDC provider + deploy IAM role |
| `ConnectDnsStack` | Route 53 hosted zone + ACM certificate |
| `ConnectDynamoStack` | Production DynamoDB tables |
| `ConnectBackendStack` | Production API Gateway + Lambda handlers |
| `ConnectFrontendStack` | Production S3 bucket + CloudFront distribution |
| `ConnectStagingDynamo/Backend/FrontendStack` | Staging environment (no custom domain) |
| `ConnectDevDynamo/Backend/FrontendStack` | Dev environment (no custom domain) |

## Deployment

Deployments are fully automated via GitHub Actions:

- **Pull requests** → quality checks → build → deploy to **dev**
- **Push to `main`** → quality checks → build → deploy to **staging** → regression tests → deploy to **production**

### Manual deployment (emergency only)

```bash
# Deploy infrastructure
npx cdk deploy ConnectDynamoStack ConnectBackendStack ConnectFrontendStack --require-approval never      # prod
npx cdk deploy ConnectStagingDynamoStack ConnectStagingBackendStack ConnectStagingFrontendStack --require-approval never  # staging
npx cdk deploy ConnectDevDynamoStack ConnectDevBackendStack ConnectDevFrontendStack --require-approval never              # dev
```

---

## Testing

### Unit tests

```bash
npm test --prefix frontend    # Jest + React Testing Library
```

### E2E tests

Playwright tests live in `e2e/`. Two suites:

| Suite | File | Purpose |
|---|---|---|
| Regression | `regression.spec.ts` | Full automation — gates prod deployment |
| Smoke | `smoke.spec.ts` | Post-deploy sanity check on production |

```bash
# Install (one-time)
cd e2e && npm install && npx playwright install

# Run regression against staging
BASE_URL=https://d36pa7dr4nksf5.cloudfront.net npx playwright test regression.spec.ts

# Run smoke against production
BASE_URL=https://connectevents.co npx playwright test smoke.spec.ts
```

See **[docs/testing/E2E-TESTING.md](docs/testing/E2E-TESTING.md)** for full reference.

---

## Documentation

### Migration & Architecture

- **[docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md)** — Phase-by-phase migration plan with CDK snippets and current status
- **[docs/CURRENT_ARCHITECTURE.md](docs/CURRENT_ARCHITECTURE.md)** — Current AWS architecture overview
- **[docs/KNOWLEDGE_TRANSFER.md](docs/KNOWLEDGE_TRANSFER.md)** — Notes from the handoff from the previous developer

### Design & Brand

- **[docs/BRAND_DIRECTION_CONNECT.md](docs/BRAND_DIRECTION_CONNECT.md)** — Brand guidelines
- **[docs/TYPOGRAPHY_GUIDE.md](docs/TYPOGRAPHY_GUIDE.md)** — Typography standards
- **[docs/frontend/DESIGN-SYSTEM.md](docs/frontend/DESIGN-SYSTEM.md)** — Design system tokens and components
- **[docs/frontend/CUSTOM-FONT-SETUP.md](docs/frontend/CUSTOM-FONT-SETUP.md)** — Font setup

### Frontend

- **[docs/frontend/HOMEPAGE-STRUCTURE.md](docs/frontend/HOMEPAGE-STRUCTURE.md)** — Homepage component structure
- **[docs/frontend/IMAGE-ASSETS.md](docs/frontend/IMAGE-ASSETS.md)** — Image asset management
- **[docs/frontend/SEO-IMPLEMENTATION-GUIDE.md](docs/frontend/SEO-IMPLEMENTATION-GUIDE.md)** — SEO implementation
- **[docs/frontend/SEO-QUICK-REFERENCE.md](docs/frontend/SEO-QUICK-REFERENCE.md)** — SEO quick checklist

### SEO & Analytics

- **[docs/SEO_AUTHORITY_STRATEGY.md](docs/SEO_AUTHORITY_STRATEGY.md)** — SEO and authority building strategy
- **[docs/GOOGLE_ANALYTICS_SETUP.md](docs/GOOGLE_ANALYTICS_SETUP.md)** — Google Analytics (property: G-86ZLZS2JEX)
- **[docs/setup/GOOGLE_SEARCH_CONSOLE_SETUP.md](docs/setup/GOOGLE_SEARCH_CONSOLE_SETUP.md)** — Search Console verification

### Forms & Integrations

- **[docs/setup/CONTACT_FORM_IMPLEMENTATION.md](docs/setup/CONTACT_FORM_IMPLEMENTATION.md)** — Contact form setup
- **[docs/setup/GOOGLE_SHEETS_SETUP.md](docs/setup/GOOGLE_SHEETS_SETUP.md)** — Google Sheets integration (5 sheet IDs)

### Website Copy

- **[docs/Website_copy/](docs/Website_copy/)** — Copywriting for site pages

### Product Requirements

- **[docs/PRD/](docs/PRD/)** — Product requirement documents and client feedback

### Development Logs

Chronological session logs from the original build:

| # | Log |
|---|---|
| 01 | [SEO preparation](docs/dev_logs/01_SEO_preparation.md) |
| 02 | [Design system setup](docs/dev_logs/02_design_system_setup.md) |
| 03 | [Homepage build](docs/dev_logs/03_homepage_build.md) |
| 04 | [About & Events pages](docs/dev_logs/04_about_events_pages.md) |
| 05 | [Join Us page](docs/dev_logs/05_join_us_page.md) |
| 06 | [Contact forms & hero updates](docs/dev_logs/06_contact_forms_and_hero_updates.md) |
| 07 | [Cloudinary integration](docs/dev_logs/07_cloudinary_integration.md) |
| 08 | [Design updates & Google Sheets](docs/dev_logs/08_design_updates_forms_google_sheets.md) |
| 09 | [Gallery fixes & contact form email](docs/dev_logs/09_gallery_fixes_contact_form_email.md) |
| 10 | [Sponsor inquiries](docs/dev_logs/10_sponsor_inquiries.md) |

### Archive

Docs from the original EC2/Docker setup kept for historical reference:

- **[docs/archive/](docs/archive/)** — Old deployment instructions, Python backend API docs, implementation summaries
