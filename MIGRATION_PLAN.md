# Beats on the Beltline — Risk Assessment & AWS Migration Plan

## Table of Contents
1. [Risk Register](#1-risk-register)
2. [Target Architecture](#2-target-architecture)
3. [Lambda BFF Analysis](#3-lambda-bff-analysis)
4. [CDK Project Structure](#4-cdk-project-structure)
5. [GitHub Actions Pipeline](#5-github-actions-pipeline)
6. [Migration Phases](#6-migration-phases)
7. [Cutover Checklist](#7-cutover-checklist)
8. [Form Data & Google Sheets Strategy](#8-form-data--google-sheets-strategy)

---

## Migration Strategy

**Single arc — build it right from the start.**

The backend routes are simple INSERTs and SELECTs with no joins. Switching to DynamoDB eliminates the VPC, NAT Gateway ($32/month), Aurora ($12–15/month), and RDS Proxy entirely — dropping the monthly AWS cost from ~$47–52 to ~$3–5. Since we're already doing a Node.js rewrite, we build the TypeScript Lambda handlers directly rather than doing a Python detour first.

**Phases 0–6:** Get deployed with the right stack (Node.js + DynamoDB).
**Phase 7 (post-launch):** S3 photo gallery — fresh build, not a migration.

---

## 1. Risk Register

### CRITICAL

| Risk | Detail | Impact |
|------|--------|--------|
| **Credentials in source control** | `docker-compose.prod.yml` and `.env` contain the Cloudinary API secret (`7NLfDFSPbupwHOcoviFHMM5FOZM`), DB password (`burger_secure_password_123`), and app `SECRET_KEY` in plaintext. Anyone with repo access, past or present, has these. | DB password and SECRET_KEY must be rotated. Cloudinary secret is lower priority — Cloudinary was never actually connected (confirmed via KT session) — but should still be rotated to clean up the committed value. |
| **No access to original AWS account** | The EC2 instances (`54.210.148.147`, `98.81.74.242`) live in an account you do not control. You cannot modify security groups, rotate SSH keys at the account level, or guarantee the instances won't be terminated. | Loss of the running server environment — but **no meaningful data loss**, as the site was never launched and the database contains no real submissions. |
| **Database has no backups** | PostgreSQL runs inside a Docker named volume (`postgresql_data`) on a single EC2 instance. There is no automated snapshot, no RDS, no off-instance backup. | **Not a concern for this migration** — the site was never launched; the database contains no production data. Real team data lives in Google Sheets. |
| **No SSL/TLS** | The app serves on `http://98.81.74.242:3000` and `http://98.81.74.242:8000`. All form submissions (names, emails, phone numbers) travel over plain HTTP. | PII exposure, MITM attacks, browser security warnings |

### HIGH

| Risk | Detail | Impact |
|------|--------|--------|
| **PostgreSQL port exposed on host** | Port 5432 is mapped `${POSTGRES_PORT:-5432}:5432` to the EC2 host. If the security group allows inbound 5432 (common on default Server Burger configs), the database is publicly reachable with the committed credentials. | Direct database breach |
| **No CI/CD or deployment safeguards** | Deployment is a manual `rsync` + SSH bash script. No review gate, no test run, no rollback mechanism. | Bad code ships directly to production with no recovery path |
| **Single point of failure** | One EC2 instance hosts all three containers. Any instance-level failure (hardware, network, OS) takes down frontend, backend, and database simultaneously with no failover. | Total outage with manual recovery required |
| **`SECRET_KEY` is a known default** | `burger_custom_secret_key_super_secure_123` is a Server Burger scaffold default. If this key signs JWTs or sessions, it is effectively public. | Auth token forgery |
| **Vendor lock-in to Server Burger** | Infrastructure is opaque — provisioned through a third-party platform with no IaC. There is no documented way to recreate the environment. | Unable to migrate, scale, or recover without the original platform account |

### MEDIUM

| Risk | Detail | Impact |
|------|--------|--------|
| **Google Sheets sync is likely broken** | All 5 form types attempt to sync to Google Sheets after writing to PostgreSQL. The service account credentials (`GOOGLE_CREDENTIALS_JSON` / `GOOGLE_CREDENTIALS_PATH`) are not present in this repo — the sync is almost certainly silently failing. Importantly, **this is not a data loss issue** — PostgreSQL is written first and is the authoritative store. All submissions are in the DB. The risk is that the team's sheet-based review workflow has been receiving no new data. | Team is reviewing stale sheet data and may be unaware submissions are coming in; no data has actually been lost |
| **Google Sheets is an active team workflow tool** | The DJ application sheet has a `RATING (internal)` column that the team manually fills in after submissions. The sheets aren't just a data dump — they are the team's review and decision-making interface for applications. Any ratings or status updates made directly in the sheets exist **only in the sheets**, not in the database (`status` and `notes` columns in the DB only ever hold the `'pending'` default since nothing updates them post-insert). Removing the integration without a replacement will break the team's operating process. | Loss of application review workflow; team's sheet-only annotations (ratings, notes) cannot be recovered from the database |
| **No observability** | No structured logging, no APM, no error tracking (Sentry DSN is optional/blank), no uptime monitoring. | No visibility into errors or performance degradation |
| **Dead configuration (Traefik labels)** | `traefik.http.routers.*` labels exist in both compose files but no Traefik container is defined. This is dead config that creates a false impression of a reverse proxy being active. | Maintenance confusion; no actual SSL termination or routing |
| **No migration framework** | Raw SQL files in `/backend/migrations/` with no runner tool (e.g., Alembic). No record of which migrations have been applied to production. | Schema drift; risky to apply new migrations against production DB |
| **Resource contention** | All services share one EC2 instance with hard CPU/memory caps (backend: 0.4 CPU / 384MB). Under load, containers will be throttled. | Latency spikes and OOM kills during events |

---

## 2. Target Architecture

```
                          ┌─────────────────────────────────────────┐
                          │              CloudFront (CDN)            │
                          │         ACM Certificate (HTTPS)          │
                          └──────────────┬──────────────────────────┘
                                         │
               ┌─────────────────────────┴─────────────────────────┐
               │                                                     │
    ┌──────────▼──────────┐                          ┌──────────────▼─────────────┐
    │   S3 Bucket         │                          │   API Gateway HTTP API     │
    │   (static Next.js)  │                          │   (REST routes /api/*)     │
    └─────────────────────┘                          └──────────────┬─────────────┘
                                                                     │
                                                        ┌────────────▼────────────┐
                                                        │   Lambda Functions       │
                                                        │   (Node.js TypeScript)   │
                                                        └────────────┬────────────┘
                                                                     │
                                              ┌──────────────────────┼──────────────────────┐
                                              │                       │                      │
                                   ┌──────────▼──────┐  ┌────────────▼──────┐  ┌────────────▼──────┐
                                   │   DynamoDB       │  │  Secrets Manager   │  │   AWS SES        │
                                   │   (6 tables)     │  │  (all credentials) │  │   (email)        │
                                   └─────────────────┘  └───────────────────┘  └───────────────────┘
```

> **No VPC.** Lambda communicates with DynamoDB, Secrets Manager, SES, and S3 over HTTPS — no private networking required. This eliminates the NAT Gateway, RDS Proxy, and Aurora entirely.

### AWS Services Summary

| Service | Purpose | Replaces |
|---------|---------|---------|
| **S3** | Hosts pre-built static Next.js output | EC2 + Docker frontend container |
| **CloudFront** | CDN + SSL termination, serves S3 and proxies `/api/*` to API Gateway | None (was running on raw HTTP) |
| **ACM** | Free TLS certificates | None |
| **API Gateway HTTP API** | Managed HTTP routing to Lambda | EC2 port 8000 |
| **Lambda** | Node.js TypeScript handlers (3 functions) | EC2 + Docker backend container |
| **DynamoDB** | 6 tables — events + 5 form types. Serverless, scales to zero | Docker postgres container |
| **Secrets Manager** | All credentials at runtime | `.env` / `docker-compose.prod.yml` |
| **AWS SES** | Outbound email for contact + sponsor forms | SMTP / Gmail |
| **CloudWatch** | Logs + metrics + alarms | `docker-compose logs` |

> **No VPC, no NAT Gateway, no RDS Proxy, no Aurora.** Lambda + DynamoDB is a fully serverless stack — every component scales to zero and bills only for what's used.

---

### Cost Analysis

This app has a specific traffic pattern that makes the new architecture particularly well-suited:

- **Baseline:** Low daily traffic from Atlanta locals checking the website
- **Spikes:** 3–4 events per year where 5,000–10,000 attendees may visit simultaneously
- **Off-season:** Near-zero traffic between events

The fundamental problem with EC2 for this pattern is that it must be **sized for peak load and billed at that size year-round** — you pay for event-day capacity every day, even during months with no events.

```
Traffic across the year:

│                    ▲               ▲               ▲
│                   ███             ███             ███
│                  █████           █████           █████
│__________________███████_________███████_________███████______
Jan                 Apr             Jul             Sep
                  Event           Event           Event

EC2: paying for ████ capacity every day of the flat line too
S3+CF: paying only for what's actually served
```

**Estimated monthly costs:**

| Item | Current (Server Burger EC2) | New (AWS + DynamoDB) |
|------|----------------------------|-----------|
| Frontend hosting | ~$40–80 (shared instance) | ~$0.01 (S3 storage) |
| CDN / SSL | None | ~$0–2 (CloudFront) |
| Backend compute | Included in EC2 | ~$0 (Lambda free tier) |
| API routing | Included in EC2 | ~$0 (API Gateway free tier) |
| Database | Included in EC2 | ~$0 (DynamoDB free tier) |
| NAT Gateway | Included in EC2 | $0 (not needed — no VPC) |
| Secrets / config | $0 (committed to git) | ~$1–2 (Secrets Manager) |
| DNS | $0 (raw IP, no domain) | ~$0.50 (Route53) |
| SSL certificate | $0 (no SSL) | $0 (ACM, free with CloudFront) |
| Monitoring | $0 (none) | ~$1–2 (CloudWatch) |
| **Total** | **~$40–80/mo** | **~$3–5/mo** |
| **Annual** | **~$480–960/yr** | **~$36–60/yr** |

> **DynamoDB free tier** covers 25GB storage, 25 WCU, and 25 RCU permanently — far more than this app will ever use.

**Savings: ~$440–900/year** vs the original EC2 setup.

**Event day behaviour comparison:**

When 3,000 people hit the site simultaneously during an event:

| | EC2 (current approach) | S3 + CloudFront |
|--|------------------------|-----------------|
| Frontend | Node.js server queues requests; container capped at 0.8 CPU / 1GB RAM; risks OOM crash | CloudFront serves cached files from Atlanta edge location; 3,000 concurrent = routine |
| Backend (forms/gallery) | FastAPI capped at 0.4 CPU / 384MB | Lambda spins up concurrent instances automatically |
| Risk of downtime | Real — during the exact moment you need the site most | Effectively zero for the frontend |

The event burst scenario is the **strongest argument** for this architecture. S3 + CloudFront was built for exactly this — high-concurrency, globally distributed, cache-first delivery. The spike that would stress an EC2 instance is invisible to CloudFront.

---

## 3. Lambda BFF Analysis

> **Approach:** Node.js TypeScript Lambda handlers using DynamoDB. No Python, no Mangum, no VPC. All routes are simple enough (single-table reads and writes) that the rewrite is straightforward and done once cleanly.

### Why Lambda Works Here

The backend is an ideal Lambda candidate. Every endpoint is:
- **Stateless** — no in-memory state between requests
- **Short-lived** — DB query + optional API call (Cloudinary/Google Sheets), done
- **Infrequent at scale** — this is an event website, not high-frequency trading

Current route inventory:

| Route | Method | Work Done | Lambda Fit |
|-------|--------|-----------|------------|
| `GET /api/events` | Read | DB query | Excellent |
| `GET /api/events/{id}` | Read | DB query | Excellent |
| `GET /api/events/{id}/gallery` | Read | DB query + Cloudinary API | Excellent |
| `GET /api/gallery` | Read | Cloudinary API | Excellent |
| `POST /api/forms/email-signup` | Write | DB insert + Google Sheets sync | Excellent |
| `POST /api/forms/vendor-application` | Write | DB insert + Google Sheets sync | Excellent |
| `POST /api/forms/volunteer-application` | Write | DB insert + Google Sheets sync | Excellent |
| `POST /api/forms/artist-application` | Write | DB insert + Google Sheets sync | Excellent |
| `POST /api/forms/sponsor-inquiry` | Write | DB insert + Sheets sync + email | Excellent |
| `POST /api/forms/contact` | Write | Email send | Excellent |

### Migration Approach: Mangum Adapter (Minimal Code Change)

[Mangum](https://mangum.fastapiexpert.com/) is an ASGI adapter that wraps any FastAPI/Starlette app for Lambda. The change to `main.py` is two lines:

```python
# main.py — add these two lines at the bottom
from mangum import Mangum
handler = Mangum(app, lifespan="off")
```

Lambda handler configuration: `main.handler`

That's it. All existing routes, middleware, and Pydantic models work without modification.

### Key Lambda Considerations

**1. Database Connections (Important)**

The current code opens a fresh `psycopg2` connection per request and closes it in `finally`. Lambda functions can have hundreds of concurrent instances, each opening their own connection — this will exhaust Aurora's connection limit quickly.

**Solution: RDS Proxy**
- RDS Proxy sits between Lambda and Aurora
- It maintains a persistent connection pool and multiplexes Lambda connections
- Lambda still uses the same `DATABASE_URL` — just points to the proxy endpoint instead of Aurora directly
- Zero code changes required

**2. Cold Starts**

Python Lambda cold starts run ~500ms–1s. For this app (an event website, not a real-time service) this is acceptable. After the first invocation, Lambda containers stay warm for several minutes.

To minimize cold start impact:
- Keep the Lambda package lean (use `--no-deps` where possible, exclude dev packages)
- Enable Lambda SnapStart (not yet available for Python, but provision concurrency is an option if needed)

**3. Google Sheets Sync**

Currently, Google Sheets sync is called inline with every form submission (with a `try/except` that silently swallows failures). In Lambda, this pattern still works, but a cleaner approach is to decouple it:

- Form submission Lambda writes to DB and publishes to SNS
- A separate "sync" Lambda subscribes to SNS and handles Google Sheets + email

This is an optional improvement — the current inline pattern will work in Lambda as-is.

**4. Secrets at Runtime**

Replace all `config("DATABASE_URL")` / `os.getenv(...)` calls with AWS Secrets Manager lookups. The Lambda execution role gets a policy to call `secretsmanager:GetSecretValue`. A thin helper reads secrets once on cold start and caches them in the module scope (warm invocations skip the Secrets Manager call).

```python
# secrets.py helper pattern
import boto3, json, os

_cache = {}

def get_secret(key: str) -> str:
    if key not in _cache:
        client = boto3.client("secretsmanager")
        secret = client.get_secret_value(SecretId=os.environ["SECRET_ARN"])
        _cache.update(json.loads(secret["SecretString"]))
    return _cache[key]
```

**5. Recommended Lambda Configuration**

| Setting | Value | Reason |
|---------|-------|--------|
| Runtime | Python 3.11 | Matches current Dockerfile |
| Memory | 512 MB | Sufficient for psycopg2 + Cloudinary SDK |
| Timeout | 30s | Google Sheets API can be slow |
| Architecture | arm64 (Graviton) | ~20% cheaper, same or better performance |
| VPC | Yes (private subnet) | Required for RDS Proxy access |

---

## 4. CDK Project Structure

```
infrastructure/
├── bin/
│   └── app.ts                  # CDK app entry point, stack instantiation
├── lib/
│   └── stacks/
│       ├── dns-stack.ts        # Route53 hosted zone + ACM cert  ← exists
│       ├── dynamo-stack.ts     # DynamoDB tables + IAM           ← Phase 2
│       ├── backend-stack.ts    # Lambda (NodejsFunction) + API Gateway + IAM  ← Phase 3
│       └── frontend-stack.ts   # S3 + CloudFront                 ← Phase 4
├── cdk.json
├── package.json
└── tsconfig.json
```

No `network-stack.ts` — Lambda + DynamoDB requires no VPC.

### Stack Dependency Order

```
DnsStack → DynamoStack → BackendStack → FrontendStack
```

### Key CDK Snippets

**dynamo-stack.ts**
```typescript
const eventsTable = new dynamodb.Table(this, 'EventsTable', {
  tableName: 'connect-events',
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

// GSI for listing all events sorted by date
eventsTable.addGlobalSecondaryIndex({
  indexName: 'byDate',
  partitionKey: { name: 'entity', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
});

// Form tables follow the same pattern — one per type
const vendorTable = new dynamodb.Table(this, 'VendorApplicationsTable', {
  tableName: 'connect-vendor-applications',
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

// GSI for admin filtering by status
vendorTable.addGlobalSecondaryIndex({
  indexName: 'byStatus',
  partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
});
```

**backend-stack.ts**
```typescript
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

// NodejsFunction uses esbuild automatically — no manual bundling needed
const eventsLambda = new NodejsFunction(this, 'EventsLambda', {
  entry: '../lambda/src/handlers/events.ts',
  handler: 'handler',
  runtime: lambda.Runtime.NODEJS_22_X,
  architecture: lambda.Architecture.ARM_64,
  memorySize: 256,
  timeout: Duration.seconds(15),
  // No vpc — DynamoDB is accessed over HTTPS
  environment: {
    EVENTS_TABLE: eventsTable.tableName,
    SECRET_ARN: appSecret.secretArn,
  },
});

eventsTable.grantReadData(eventsLambda);
appSecret.grantRead(eventsLambda);
```

**frontend-stack.ts**
```typescript
// S3 bucket — hosts the static Next.js export output
const siteBucket = new s3.Bucket(this, 'FrontendBucket', {
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // CloudFront accesses via OAC, not public
  removalPolicy: RemovalPolicy.RETAIN,
});

// Origin Access Control — lets CloudFront read from S3 without making the bucket public
const oac = new cloudfront.S3OriginAccessControl(this, 'OAC');

// CloudFront in front of S3 (frontend) and API Gateway (backend)
const distribution = new cloudfront.Distribution(this, 'CDN', {
  defaultBehavior: {
    origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket, { originAccessControl: oac }),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
  },
  additionalBehaviors: {
    '/api/*': {
      origin: new origins.HttpOrigin(`${api.apiId}.execute-api.${region}.amazonaws.com`),
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    },
  },
  defaultRootObject: 'index.html',
  errorResponses: [
    // Route all 404s back to index.html for client-side routing
    { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
  ],
  certificate: acmCert,
  domainNames: [domainName],
});

// Export bucket name for GitHub Actions to sync the build output
new CfnOutput(this, 'FrontendBucketName', { value: siteBucket.bucketName });
new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
```

---

## 5. GitHub Actions Pipeline

### Workflow Structure

```
.github/
└── workflows/
    ├── pr.yml          # On every PR: lint, test, CDK diff (posts diff as PR comment)
    ├── staging.yml     # On merge to main: build + CDK deploy to staging
    └── production.yml  # On release tag (v*.*.*): CDK deploy to production
```

### pr.yml

```yaml
name: PR Checks

on:
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Backend lint + test
        run: |
          pip install -r backend/requirements.txt ruff pytest
          ruff check backend/
          pytest backend/tests/ -v

      - name: Frontend lint + type check
        run: |
          cd frontend && npm ci && npm run lint

  cdk-diff:
    runs-on: ubuntu-latest
    permissions:
      id-token: write   # OIDC auth to AWS — no long-lived keys
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_STAGING_DEPLOY_ROLE_ARN }}
          aws-region: us-east-1

      - name: CDK diff
        id: diff
        run: |
          cd infrastructure && npm ci
          DIFF=$(npx cdk diff --all 2>&1)
          echo "diff<<EOF" >> $GITHUB_OUTPUT
          echo "$DIFF" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Post diff as PR comment
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '### CDK Diff\n```\n${{ steps.diff.outputs.diff }}\n```'
            })
```

### staging.yml

```yaml
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_STAGING_DEPLOY_ROLE_ARN }}
          aws-region: us-east-1

      - name: Build backend Lambda package
        run: |
          cd backend
          pip install -r requirements.txt -t dist/
          cp -r . dist/ && cd dist && zip -r ../lambda.zip .

      - name: Build frontend static export
        run: |
          cd frontend && npm ci
          npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.STAGING_API_URL }}

      - name: CDK deploy (staging)
        run: |
          cd infrastructure
          npm ci
          npx cdk deploy --all --require-approval never \
            -c environment=staging

      - name: Sync frontend to S3 + invalidate CloudFront
        run: |
          aws s3 sync frontend/out/ s3://${{ secrets.STAGING_FRONTEND_BUCKET }} \
            --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "*.html"
          aws s3 sync frontend/out/ s3://${{ secrets.STAGING_FRONTEND_BUCKET }} \
            --delete \
            --cache-control "no-cache" \
            --include "*.html"
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.STAGING_DISTRIBUTION_ID }} \
            --paths "/*"
```

### production.yml

```yaml
name: Deploy to Production

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production   # requires manual approval in GitHub UI
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_PROD_DEPLOY_ROLE_ARN }}
          aws-region: us-east-1

      # ... same backend build + frontend build steps as staging ...

      - name: CDK deploy (production)
        run: |
          cd infrastructure
          npm ci
          npx cdk deploy --all --require-approval never \
            -c environment=production

      - name: Sync frontend to S3 + invalidate CloudFront
        run: |
          aws s3 sync frontend/out/ s3://${{ secrets.PROD_FRONTEND_BUCKET }} \
            --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "*.html"
          aws s3 sync frontend/out/ s3://${{ secrets.PROD_FRONTEND_BUCKET }} \
            --delete \
            --cache-control "no-cache" \
            --include "*.html"
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.PROD_DISTRIBUTION_ID }} \
            --paths "/*"
```

### AWS Auth: OIDC (No Long-Lived Keys)

The workflows use OIDC federation — GitHub Actions assumes an IAM role without storing AWS credentials in GitHub secrets. This is the modern standard.

```typescript
// In your CDK stack
new iam.OpenIdConnectProvider(this, 'GitHubOIDC', {
  url: 'https://token.actions.githubusercontent.com',
  clientIds: ['sts.amazonaws.com'],
});

new iam.Role(this, 'GitHubActionsDeployRole', {
  assumedBy: new iam.WebIdentityPrincipal(oidcProvider.openIdConnectProviderArn, {
    StringLike: {
      'token.actions.githubusercontent.com:sub': 'repo:YOUR_ORG/YOUR_REPO:*',
    },
  }),
  managedPolicies: [/* least-privilege deploy policies */],
});
```

---

## 6. Migration Phases

### Phase 0 — Immediate (Before Anything Else)

These actions are independent of the migration and should happen today:

- [ ] **Rotate Cloudinary API secret** — Log into Cloudinary (`beats-on-beltline` account), generate a new API secret. Note: Cloudinary was never actually connected (confirmed via KT session) so this is just cleanup of a committed value, not an active breach risk.
- [ ] **Rotate DB password** — SSH into the EC2 instance (if you still have access) and run `ALTER USER burger_user WITH PASSWORD 'new-password'`; update `docker-compose.prod.yml`
- [ ] **Rotate `SECRET_KEY`** — Generate a new 64-char random string; update and redeploy
- [ ] **Add `.env` and `docker-compose.prod.yml` to `.gitignore`** — Stop the bleeding for future commits
- [ ] **Audit git history** — Run `git log --all --oneline` and consider whether the repo needs a history rewrite (`git filter-repo`) to purge committed secrets, depending on who has access to the repo

---

### Phase 1 — Foundation ✅ Complete

- [x] Create AWS account (account: `145185391901`, region: `us-east-1`)
- [x] Install AWS CLI + CDK, configure credentials
- [x] Bootstrap CDK: `cdk bootstrap aws://145185391901/us-east-1`
- [x] Initialize `infrastructure/` CDK project (TypeScript)
- [x] Write and deploy `DnsStack` — Route53 hosted zone + ACM cert for `connectevents.co` + `www.connectevents.co`
- [x] Add ACM DNS validation CNAMEs to Namecheap — cert issued
- [ ] Set up billing alerts in AWS console
- [ ] Configure branch protection on `main` in GitHub

---

### Phase 2 — DynamoDB Tables ✅ Complete

- [x] Write and deploy `DynamoStack` — 6 tables:
  - `connect-events` (PK: `id`, GSI: `byDate` on `entity`/`date`)
  - `connect-email-signups` (PK: `id`, GSI: `byStatus` on `status`/`createdAt`)
  - `connect-vendor-applications` (PK: `id`, GSI: `byStatus`)
  - `connect-volunteer-applications` (PK: `id`, GSI: `byStatus`)
  - `connect-artist-applications` (PK: `id`, GSI: `byStatus`)
  - `connect-sponsor-inquiries` (PK: `id`, GSI: `byStatus`)
- [ ] Seed `connect-events` table with current event data via a one-off script

---

### Phase 3 — Node.js Lambda Backend ✅ Complete

- [x] Create `lambda/` directory (TypeScript, Node.js 22, ARM64)
- [x] Write `handlers/events.ts` — GET /api/events, GET /api/events/:id (DynamoDB `byDate` GSI)
- [x] Write `handlers/forms.ts` — POST /api/forms/* (6 form types; SES email for contact + sponsor)
- [x] Write and deploy `BackendStack` — 2 `NodejsFunction` constructs + API Gateway HTTP API
- [x] IAM: EventsLambda → read events table; FormsLambda → write all 5 form tables + SES send
- [ ] Verify routes end-to-end via form submissions on live site
- [ ] SES domain verification for `noreply@connectevents.co` — handle in Phase 5
- [ ] Delete `backend/` Python directory — after Phase 5 cutover confirmed stable

---

### Phase 4 — Frontend Static Export ✅ Complete

- [x] Update `next.config.js`: `output: 'export'`, `unoptimized: true`, remove `rewrites()` / `headers()` / Cloudinary
- [x] Delete `frontend/pages/api/` — Next.js proxy routes replaced by CloudFront → API Gateway routing
- [x] Replace `pages/sitemap.xml.js` (used `getServerSideProps`) with static `public/sitemap.xml`
- [x] Write and deploy `FrontendStack` — S3 bucket + CloudFront (OAI) + Route53 A records
- [x] Build frontend: `npm run build` → `out/` directory produced cleanly
- [x] Sync `out/` to S3, invalidate CloudFront — site live at `https://d34vrmm0q27tmb.cloudfront.net`
- [ ] Test all forms end-to-end
- [ ] Set up CloudWatch alarms: Lambda error rate, Lambda p99 duration, CloudFront 5xx rate

---

### Phase 5 — Cutover

Switch production traffic to the new stack. Route53 A records already point to CloudFront (created in Phase 4) — just needs nameservers switched at Namecheap.

- [ ] Verify SES domain: add DKIM/TXT records to Namecheap → verify `noreply@connectevents.co` in SES console
- [ ] Test all forms end-to-end on CloudFront URL before switching
- [ ] At Namecheap: update nameservers to Route53 nameservers (output from `ConnectDnsStack`)
- [ ] Verify `https://connectevents.co` resolves and HTTPS works
- [ ] Monitor for 24 hours — CloudWatch logs, Lambda error rates, form submissions in DynamoDB
- [ ] Set up a CloudWatch dashboard with key metrics
- [ ] Configure SNS alerts for Lambda errors and high latency

---

### Phase 6 — Decommission (Week 6)

- [ ] Confirm no traffic is hitting the old EC2 instances (check CloudFront access logs)
- [ ] No database dump needed — the EC2 database contains no production data
- [ ] The old EC2 instances can be abandoned — they'll eventually be terminated by whoever controls the Server Burger account
- [ ] Remove Server Burger-specific config from the repo (`scripts/custom_build_config.json`, `scripts/deploy.sh`, `scripts/ssh-connect.sh`)
- [ ] Archive or remove `docker-compose.prod.yml` (keep `docker-compose.yml` for local dev)
- [ ] `frontend/Dockerfile` and `frontend/Dockerfile.prod` can be deleted — the frontend no longer deploys as a container
- [ ] **Do not remove Google Sheets integration yet** — the admin page (Section 8) must be live and the team must have signed off on their new workflow before `google_sheets_service.py` can be deleted
- [ ] Delete dead Cloudinary backend code — `backend/services/cloudinary_service.py`, gallery routes in `backend/routes/events.py`, and `cloudinary` from `requirements.txt`. Cloudinary was never connected (confirmed via KT session) so there is no active integration to preserve.

---

### Phase 7 — Node.js Lambda Rewrite (Post-Launch)

Build a real S3-backed photo gallery from scratch. Cloudinary was never connected — this is a new feature, not a migration.

**Architecture:**

| Component | Detail |
|-----------|--------|
| Storage | S3 media bucket (separate from frontend static bucket) |
| Delivery | CloudFront (add media bucket as a second origin, path `/events/*`) |
| Listing API | `s3.list_objects_v2(Prefix=...)` in a new `handlers/gallery.ts` Lambda |
| Thumbnails | Pre-generated on upload via S3 `ObjectCreated` trigger + `sharp` |

**Thumbnail strategy:**
```
s3://media-bucket/
  events/sept-2025/photos/img001.jpg
  events/sept-2025/photos/thumbnails/img001.jpg   ← auto-generated on upload
```

**DynamoDB:** Add `mediaFolder` attribute to event items (replaces the old `cloudinary_folder` concept).

**Checklist:**
- [ ] Add S3 media bucket + CloudFront origin to CDK
- [ ] Write thumbnail generator Lambda (`sharp` + S3 `ObjectCreated` trigger)
- [ ] Write `handlers/gallery.ts` using `@aws-sdk/client-s3`
- [ ] Upload event photos from Google Drive to S3
- [ ] Rewrite `/gallery` frontend page to call the new API
- [ ] Update `next.config.js` — remove `res.cloudinary.com`, add CloudFront media domain
- [ ] Verify gallery loads end-to-end

---

## 7. Cutover Checklist

Before pointing DNS at the new stack, verify:

- [ ] All 10 API routes return expected responses via the CloudFront URL
- [ ] All 5 form types submit successfully and appear in both the database and Google Sheets (Sheets sync is still the team's primary workflow at cutover time — the admin page replaces it later, not during cutover)
- [ ] Gallery page shows graceful empty state (real gallery built in Phase 7 post-launch)
- [ ] Contact form sends an email notification
- [ ] HTTPS certificate is valid (no browser warnings)
- [ ] CORS is correctly configured (frontend domain → API Gateway)
- [ ] CloudWatch logs show no errors during smoke testing
- [ ] Aurora automated backup is confirmed enabled
- [ ] Secrets are only in Secrets Manager — no plaintext credentials anywhere in the codebase or environment variables
- [ ] `.env` and `docker-compose.prod.yml` are in `.gitignore`

---

## 8. Form Data & Google Sheets Strategy

### What Google Sheets Is Actually Doing

Google Sheets is syncing **all 5 form types** — not just email signups:

| Form | Sheet ID | Team Use |
|------|----------|----------|
| Email signups | `12gfqB3p103wo8vS...` | Mailing list |
| Vendor applications | `1SUbvzglTqd6iF...` | Review & approve vendors |
| Volunteer applications | `1-V9HV0AJWqd...` | Review volunteers |
| DJ/Artist applications | `1EF3DzG4Ojay...` | Review + **manually rate artists** |
| Sponsor inquiries | Set via `SPONSOR_INQUIRY_SHEET_ID` env var | Review sponsors |

The DJ sheet has a `RATING (internal)` column (column B) that the app intentionally leaves blank — the team fills it in manually after reviewing submissions. **The sheets are the team's application review interface**, not just a data store.

### Actual Current State: Google Sheets Is the Source of Truth

The site was never publicly launched. The team's real workflow is:

```
Team member fills out Google Form
  │
  └─► Google Sheets  ← this is where all real application data lives
```

The EC2 database contains no meaningful submissions. When this application goes live, PostgreSQL will become the source of truth going forward — but there is no existing data to migrate from the old server.

### The Code's Intended Data Flow (for reference)

The application code is designed so that PostgreSQL is primary and Sheets is secondary:

```
POST /api/forms/vendor-application
  │
  ├─► 1. PostgreSQL INSERT  ← required, blocks response
  ├─► 2. Google Sheets sync ← fire-and-forget, failures silently swallowed
  └─► 3. Return { success: true } to user
```

The Sheets sync was almost certainly never working in this deployment — the service account credentials (`GOOGLE_CREDENTIALS_JSON` / `GOOGLE_CREDENTIALS_PATH`) are not in the repo. This doesn't matter for the migration since there is no data there to preserve.

### Historical Data in Google Sheets

The team's actual submission history — DJ ratings, vendor applications, volunteer sign-ups — lives in the Google Sheets the team has been managing via Google Forms. When the admin page is built, the team should decide whether to:
1. Import historical data from the Google Sheets CSVs into Aurora (manual one-time data entry or a simple import script), or
2. Treat the new app as a fresh start and keep the old sheets as an archive

The DJ/Artist sheet's `RATING` column is the only data that exists nowhere else and is worth preserving if historical context matters.

### Recommendation: Two Different Solutions for Two Different Problems

---

**Email Signups → Mailchimp**

Email signups are a list management problem, not an application review problem. The right tool is a dedicated email marketing platform.

**Why Mailchimp:**
- Free tier supports up to 500 contacts (right size for an event org)
- Subscribers are viewable and filterable in the Mailchimp dashboard — the team can see everyone who signed up, when, and whether they consented to marketing
- Built-in unsubscribe handling (legally required under CAN-SPAM)
- The team can send event announcements, newsletters, and campaigns without any dev involvement
- Has a simple REST API — the Lambda replaces the Sheets call with a single POST to `/3.0/lists/{list_id}/members`

The code change in `forms.py` is minimal — swap `google_sheets_service.submit_email_signup()` for a Mailchimp API call. The Aurora DB still stores signups as the source of truth; Mailchimp is the delivery and visibility layer.

Add to `requirements.txt`:
```
mailchimp-marketing==3.0.80
```

Replace the Sheets call in `submit_email_signup`:
```python
import mailchimp_marketing as MailchimpMarketing

def sync_to_mailchimp(data: dict):
    client = MailchimpMarketing.Client()
    client.set_config({"api_key": get_secret("MAILCHIMP_API_KEY"), "server": "us1"})
    client.lists.add_list_member(
        get_secret("MAILCHIMP_LIST_ID"),
        {
            "email_address": data["email"],
            "status": "subscribed" if data["marketing_consent"] else "transactional",
            "merge_fields": {"FNAME": first_name, "LNAME": last_name, "PHONE": data.get("phone", "")},
        }
    )
```

---

**Application Forms → Admin Page (prerequisite before removing Sheets)**

The four application form types (vendor, volunteer, artist, sponsor) need a human review workflow. The team is currently doing this in Google Sheets — rating DJs, updating statuses, adding notes. You cannot remove the Sheets integration until you've replaced that workflow.

**Recommended approach: Password-protected admin page in Next.js**

A `/admin` route (behind HTTP Basic Auth or a simple hardcoded password for now) that provides:

| View | Data Shown | Actions |
|------|-----------|---------|
| Vendor Applications | Business name, type, email, phone, status | Update status (pending / approved / rejected), add notes |
| Volunteer Applications | Name, email, skills, experience, status | Update status, add notes |
| DJ/Artist Applications | DJ name, genre, links, status | Update status, add **rating field** (replacing the manual Sheets column), add notes |
| Sponsor Inquiries | Company, industry, contact, status | Update status, add notes |

The `status` and `notes` columns already exist in Aurora from the existing migrations. The DJ rating can be added as a new column in a migration. All of this reads directly from Aurora via the Lambda API — no new infrastructure required.

**Phase for this work:** Build and deploy the admin page before Phase 6 (Decommission). Once the team has used it for one full event cycle and confirmed it meets their needs, delete `google_sheets_service.py` and remove the 5 sync calls from `forms.py`.

---

### Migration Sequence for Forms

```
Phase 3 (Lambda deploy)
  └─ Keep Sheets sync as-is — verify it works with new Lambda

Post-Phase 5 (after cutover, new feature work)
  ├─ Replace email signup Sheets call with Mailchimp API
  ├─ Build /admin page for application review
  └─ Team uses both Sheets + admin page in parallel for one event

After team sign-off
  └─ Delete google_sheets_service.py
     Remove sync calls from forms.py
     Remove gspread + google-auth from requirements.txt
```

---

## Appendix: Dependencies to Add

### Arc 1 — Phases 0–6 (Python + Mangum)

**Backend (`backend/requirements.txt`)**
```
mangum==0.17.0              # ASGI adapter for Lambda
boto3==1.34.0               # AWS SDK for Secrets Manager
mailchimp-marketing==3.0.80 # Email list sync (replaces Google Sheets for email signups)
```

**Infrastructure (`infrastructure/package.json`)**
```json
{
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.0.0"
  }
}
```

> Note: S3, CloudFront, and API Gateway are all part of `aws-cdk-lib` — no additional alpha packages needed.

---

### Arc 2 — Phases 7–8 (Node.js rewrite + Cloudinary → S3)

**Lambda (`lambda/package.json`)**
```json
{
  "dependencies": {
    "pg": "^8.11.0",
    "googleapis": "^140.0.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/client-ses": "^3.0.0",
    "@aws-sdk/client-secrets-manager": "^3.0.0",
    "mailchimp-marketing": "^3.0.80",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/aws-lambda": "^8.10.0",
    "@types/pg": "^8.11.0",
    "esbuild": "^0.20.0"
  }
}
```

**Thumbnail generator Lambda (`lambda/src/handlers/thumbnail.ts`)**
```
sharp   # Image resizing — must be built for Lambda's Linux ARM64 architecture
```

> Note: `sharp` requires a platform-specific binary. Use CDK's `NodejsFunction` bundling with `nodeModules: ['sharp']` to ensure the correct Linux ARM64 build is included in the Lambda package.
