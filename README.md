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

## Documentation

See [`docs/`](docs/) for full project documentation including the migration plan, architecture overview, and knowledge transfer notes.
