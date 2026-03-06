<!--
SYNC IMPACT REPORT
==================
Generated: 2026-03-06
Version change: 1.2.0 → 1.2.1 (PATCH — clarify current deployment reality: staging always
  promotes to production on merge to main; no manual verification gate required)

Modified principles:
  ~ III. Environment Discipline — removed "deploys only after staging regression tests pass";
         production now deploys automatically after staging. Will be revisited when
         automation tests are introduced.
  ~ X.   Testing Standards — removed manual staging verification requirement; current policy
         is automatic promotion on merge to main.

Modified sections:
  ~ Development Workflow > Branching & Deployment — removed "regression tests" gate from
    the merge-to-main flow.

Added sections: none
Removed sections: none

Template consistency review:
  ✅ .specify/templates/plan-template.md — no updates needed.
  ✅ .specify/templates/spec-template.md — no updates needed.
  ✅ .specify/templates/tasks-template.md — no updates needed.
  ✅ .specify/templates/constitution-template.md — source template intact; no drift.
  ℹ️  .specify/templates/commands/ — no command files found; skipped.

Deferred TODOs:
  - Automation testing constitution: defer to future spec.
  - Unit testing constitution: defer to future spec.
  - Integration testing constitution: defer to future spec.
  - Promotion gate (regression tests blocking prod): reinstate when automation tests defined.
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
There is currently no automated or required manual testing gate. Merging to `main` always promotes
to production via staging — no verification step blocks the promotion. This policy will be updated
when an automation test strategy is defined in a dedicated future spec. Until that spec is ratified,
the CI quality checks (lint, type-check, build) are the only mandatory gates before merge.

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

**Version**: 1.2.1 | **Ratified**: 2026-03-06 | **Last Amended**: 2026-03-06
