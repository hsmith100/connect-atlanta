# Connect Atlanta

Event platform for [Beats on the Beltline](https://connectevents.co) — a recurring outdoor music event on the Atlanta Beltline.

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

| Environment | URL |
|---|---|
| Production | https://connectevents.co |
| Staging | https://d36pa7dr4nksf5.cloudfront.net |

## Local Development

**Prerequisites:** Node.js 22, AWS CLI (authenticated)

```bash
# Install all dependencies
npm run install:all

# Copy env file and fill in values
cp frontend/.env.local.example frontend/.env.local

# Start frontend dev server
npm run dev --prefix frontend
```

The dev server proxies `/api/*` requests to the staging API Gateway URL set in `NEXT_PUBLIC_API_URL`.

## CDK Stacks

| Stack | Description |
|---|---|
| `ConnectCiStack` | GitHub Actions OIDC provider + deploy IAM role |
| `ConnectDnsStack` | Route 53 hosted zone + ACM certificate |
| `ConnectDynamoStack` | DynamoDB tables |
| `ConnectBackendStack` | API Gateway + Lambda handlers |
| `ConnectFrontendStack` | S3 bucket + CloudFront distribution |

Staging equivalents are prefixed with `ConnectStaging*` (no custom domain).

## Deployment

Deployments are fully automated via GitHub Actions:

- **Pull requests** → quality checks → build → deploy to staging
- **Push to `main`** → quality checks → build → deploy to production

### Manual deployment (emergency only)

```bash
# Deploy infrastructure
npm run deploy:prod       # production stacks
npm run deploy:staging    # staging stacks

# Sync frontend after build
npm run build:frontend
npm run sync:prod         # or sync:staging

# Invalidate CloudFront cache
npm run invalidate:prod   # or invalidate:staging
```

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
