<!--
SYNC IMPACT REPORT
==================
Generated: 2026-10-05
Version change: 1.4.1 → 1.5.0 (MINOR — materially expanded Principle X with mandatory
  end-to-end (Playwright) test requirements; Principle XIII and Development Workflow updated
  to match.)

Modified principles:
  ~ X. Testing Standards — added "End-to-End Tests" subsection (MUST rules for new public
    pages, user flows, payment flows, smoke-suite safety, and data independence)
  ~ XIII. Pre-PR Validation Gate — added local e2e run requirement when e2e specs change

Added sections: none (new subsection within Principle X)

Removed sections: none

Template consistency review:
  ✅ .specify/templates/tasks-template.md — Tests note now names e2e requirement; Polish phase
       gains an e2e coverage placeholder task
  ✅ .specify/templates/plan-template.md — no structural change needed; the Constitution Check
       table is generated from this file, and the Testing field already prompts for tooling
  ✅ .specify/templates/spec-template.md — no change; principle applies at plan/task time
  ✅ README.md — E2E section already documents suites; added pointer to Principle X
  ✅ docs/testing/E2E-TESTING.md — added "When E2E tests are required" section
  ℹ️  .specify/templates/commands/ — directory does not exist; skipped.

Deferred TODOs: none
-->

# Connect Atlanta Constitution

## Core Principles

### I. Stack Fidelity
The stack is fixed: Next.js static export → S3 + CloudFront, API Gateway → Lambda (Node.js TypeScript),
DynamoDB, AWS CDK. Do not introduce new runtimes, frameworks, or managed services without explicit
approval. Every new feature MUST fit within this architecture — if it doesn't, raise the conflict
before building.

### II. Simplicity First (YAGNI)
Build only what is asked. Do not add error handling for scenarios that can't happen, do not add
abstractions for one-time use, do not add configuration for hypothetical future needs. Three similar
lines of code is better than a premature abstraction. Complexity MUST be justified by a real, present
requirement.

### III. Environment Discipline
There are three environments: **dev** (PR deploys, local development), **staging** (QA sandbox,
deploys on merge to `main`), **production** (live site, deploys automatically after staging). Never
deploy directly to production. Never test against production data. Local dev always points to the
dev API (`connect-dev-*` DynamoDB tables).

### IV. DynamoDB Is Source of Truth
All application data lives in DynamoDB. No Google Sheets sync, no external databases, no file-based
storage of application state. Schema is schemaless by design — add new optional fields freely without
migration scripts. Table naming convention: `connect-{env}-{resource}` (e.g. `connect-dev-events`,
`connect-staging-photos`). Prod tables omit the env prefix (e.g. `connect-events`).

### V. Security Boundaries
Admin functionality is protected by a secret key stored in AWS Secrets Manager, passed as
`x-admin-key` header. Never hardcode secrets. Never commit `.env.local`. Public API routes require no
auth. The admin key is per-environment — dev, staging, and prod each have their own. IAM follows
least-privilege; GitHub Actions uses OIDC (no long-lived keys).

### VI. Lambda Handler Pattern
Lambda handlers are thin routers. Business logic lives in dedicated handler files
(`formSubmissions.ts`, `adminSubmissions.ts`, `adminEvents.ts`, etc.), not in the router. Shared
utilities (DynamoDB client, SES client, response helpers, auth) live in `lib/` files. Always `await`
async operations inside Lambda handlers — never fire-and-forget with `void`, as the Lambda will
terminate before the operation completes.

### VII. Frontend Static Export
The frontend is a Next.js static export (`output: 'export'`). There is no server-side rendering, no
API routes, no `getServerSideProps`. All data fetching happens client-side. In development, `/api/*`
is proxied to the dev API Gateway via `next.config.js` rewrites using `NEXT_PUBLIC_API_URL`. In
production, CloudFront routes `/api/*` to API Gateway directly.

### VIII. CDK Infrastructure as Code
All AWS infrastructure is defined in CDK stacks under `infrastructure/lib/stacks/`. Never create or
modify AWS resources manually in the console — changes MUST go through CDK. Stack outputs are the
source of truth for resource identifiers (bucket names, distribution IDs, API URLs). The
`--require-approval never` flag is used only in CI/CD; manual deployments MUST review changesets.

### IX. Code Quality
TypeScript strict mode is the baseline — `any` is prohibited except where a third-party type gap
makes it genuinely unavoidable (document the reason inline). No `console.log` in committed code;
use structured logging or remove debug output before merging. No unused imports, variables, or dead
code paths. All shared types MUST live in `shared/types/` and be imported by both frontend and
lambda — never duplicate type definitions across packages. Linting and formatting checks MUST pass
in CI before a PR can merge.

### X. Testing Standards
Unit tests are REQUIRED for all new code. The test infrastructure is fully operational:

- **Lambda** (`lambda/`): Jest + ts-jest. Run with `npm test`. Test files are colocated with source
  (e.g., `formShared.test.ts` next to `formShared.ts`). AWS SDK is mocked via `aws-sdk-client-mock`.
- **Frontend** (`frontend/`): Jest + React Testing Library. Run with `npm test -- --ci`. Test files
  are colocated with components and lib files.

**What MUST be tested:**
- All new Lambda handler functions and lib utilities
- All new frontend components that contain logic (state, API calls, conditional rendering)
- All new pure utility functions (`lib/formatters.ts`, `lib/api/`, `submissions/shared.ts`, etc.)

**What is exempt:**
- Purely presentational components with no logic
- CDK infrastructure code
- Next.js page files that are thin wrappers around tested components

Both test suites run as mandatory CI gates (`test-lambda` and `test-frontend` jobs in
`.github/workflows/quality-checks.yml`) — a PR MUST NOT be merged if any test fails. Tests MUST
pass alongside lint, typecheck, and build before merge.

#### End-to-End Tests

Playwright tests live in `e2e/`. `regression.spec.ts` runs against every PR environment and
against staging before production deploys; `smoke.spec.ts` runs against production after deploy
and triggers automatic rollback on failure. Unit tests prove components work in isolation; e2e
tests prove the deployed site works for a visitor.

**What MUST have e2e coverage:**
- Every new or renamed public page that renders without query parameters: add it to
  `CORE_PAGES` in `e2e/types/pages.ts` (heading visible, no JS errors), which covers both
  regression and smoke. Pages that require query parameters (e.g. a token or ID) MUST instead be
  covered by a regression test that visits them with a missing or invalid parameter and asserts
  the error state.
- Every new user flow (a multi-step journey such as browse → cart, or submit form → confirmation):
  at least one regression test exercising the happy path through the deployed frontend and API.
- Every payment or money-moving flow: a full end-to-end purchase test using the payment
  provider's **test mode**, running on PR environments. Payment tests MUST NOT run against
  production or use live keys.
- Navigation changes: the navigation regression test MUST be updated in the same PR.

**Rules for e2e tests:**
- Regression tests MUST pass on an empty PR environment and on staging. Assert on either-state
  outcomes (data or empty state), or seed the data the test needs through an idempotent seed
  script that refuses to run outside PR environments.
- The smoke suite MUST be read-only: no form submissions, purchases, or writes of any kind.
- A PR that changes existing page headings, routes, or navigation MUST update the affected e2e
  tests in the same PR — a broken regression suite blocks production deploys.

**What is exempt:** admin-only screens (`/admin`), which are covered by unit tests, and purely
visual changes with no new route, flow, or navigation change.

E2E test tasks MUST appear in `tasks.md` for any feature that meets the criteria above.

### XI. User Experience Consistency
All UI MUST use Tailwind utility classes — no inline styles, no CSS modules, no styled-components.
Every async operation (API calls, image uploads) MUST display a loading state so users are never
left staring at a frozen interface. Error states MUST surface a human-readable message; raw error
objects or HTTP status codes MUST NOT be shown to end users. The site MUST be fully usable on
mobile viewports (320px minimum) — design mobile-first and expand for desktop. Component patterns
established in the codebase (e.g., tab navigation, card layouts, form structure) MUST be reused
rather than reinvented; new UI patterns require explicit justification.

### XII. Performance Requirements
The static export + CloudFront architecture provides fast baseline page loads — do not undermine it.
All media (photos, flyers) MUST be served from the dedicated media CloudFront distribution, never
directly from S3 or an external origin. Image thumbnails MUST be used in list/gallery views;
full-resolution images are only loaded on explicit user request. Client-side data fetching MUST be
parallelized where results are independent (e.g., `Promise.all` for upcoming and past events). Lambda
cold starts are acceptable but MUST NOT be introduced into synchronous user-facing interactions
through unnecessary handler chaining. CloudFront cache behavior MUST be considered for every new
route — static assets use long TTLs, API responses use no-cache.

### XIII. Pre-PR Validation Gate
Before opening a pull request, the implementer MUST run all quality checks locally and confirm they
pass. A PR MUST NOT be opened when locally-reproducible failures exist — CI is not a substitute for
local validation.

**Required checks before every PR:**

```bash
# Frontend — from frontend/
npm test -- --ci     # all tests must pass
npm run lint         # zero errors (warnings acceptable)
npm run typecheck    # zero type errors

# Lambda — from lambda/
npm test             # all tests must pass
```

**Why this is required**: CI pipeline runs are ephemeral and results arrive minutes after push.
**When the PR adds or changes e2e specs**, also run the affected specs locally against the dev
server or a deployed environment before opening the PR:

```bash
# E2E — from e2e/ (frontend dev server running, or BASE_URL pointing at a deployed env)
BASE_URL=http://localhost:3000 npx playwright test regression.spec.ts --project=chromium
```

Catching failures locally before push eliminates the turnaround cost of fixing trivial issues
(failing tests, lint errors, type errors) that were known before the PR was opened. The CI pipeline
is a safety net, not a first-line check.

**Scope**: This gate applies to all implementation work — features, fixes, refactors, and dependency
updates. It does not apply to documentation-only changes (`*.md`, `specs/`) that have no code impact.

## Development Workflow

### Branching & Deployment
- Feature branches → PR → auto-deploys to dev environment
- Merge to `main` → auto-deploys to staging → auto-deploys to production
- PRs get a dev CloudFront URL comment for review
- Hotfixes follow the same flow — no shortcuts to production

### Adding New Features
1. New DynamoDB fields: add to `shared/types/`, update Lambda handler, update admin UI, update
   frontend display — all in one PR
2. New Lambda routes: add handler function, register route in the router (`photos.ts` or `forms.ts`),
   update API client in `frontend/lib/api/`
3. New CDK resources: add to the appropriate stack, deploy staging first to validate, then production
4. New public pages, user flows, or navigation changes: add or update Playwright tests in `e2e/`
   in the same PR (Principle X, End-to-End Tests)

### Code Style
- TypeScript everywhere — no `any` unless absolutely unavoidable (Principle IX)
- No comments unless the logic is non-obvious
- No docstrings on internal functions
- Tailwind for all styling — no inline styles, no CSS modules (Principle XI)
- Shared types live in `shared/types/` and are imported by both frontend and lambda (Principle IX)

## Governance

This constitution supersedes all other conventions. When in doubt, prefer simplicity, prefer the
existing pattern, and prefer asking over assuming.

**Amendment procedure**: Update this file, increment the version per semantic versioning rules
(MAJOR: principle removal/redefinition; MINOR: new principle or section; PATCH: wording/typo fixes),
update `LAST_AMENDED_DATE`, and regenerate the Sync Impact Report comment above.

**Compliance review**: Every PR that adds a new feature or changes architecture MUST include a
Constitution Check in its plan.md confirming no principle violations. Violations MUST be documented
in the Complexity Tracking table with justification.

**Version**: 1.5.0 | **Ratified**: 2026-03-06 | **Last Amended**: 2026-10-05
