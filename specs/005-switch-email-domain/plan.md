# Implementation Plan: Switch Email Domain to beatsontheblockfest.com

**Branch**: `005-switch-email-domain` | **Date**: 2026-05-26 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/005-switch-email-domain/spec.md`

## Summary

Two distinct email failures need to be resolved after the beatsontheblockfest.com domain rebrand:

1. **`updates@beatsontheblockfest.com` goes to spam** — the domain has no SPF, DKIM, or DMARC records, so receiving mail servers treat it as unauthenticated.
2. **`info@beatsontheblockfest.com` does not send at all** — beatsontheblockfest.com has never been verified as a sending identity in SES.

The fix requires three coordinated changes: (a) verify beatsontheblockfest.com as an SES sending domain and add its DKIM records to Route53, (b) add SPF/DMARC/MX DNS records for the domain, and (c) update the Lambda env vars to use `info@beatsontheblockfest.com` as the FROM and CONTACT address for production.

## Technical Context

**Language/Version**: TypeScript 5.x (CDK infrastructure) / TypeScript 5.x (Lambda Node.js 20.x)  
**Primary Dependencies**: `aws-cdk-lib` v2 — `aws_ses.EmailIdentity`, `aws_route53` record types; `@aws-sdk/client-ses` (Lambda, no code changes)  
**Storage**: N/A — no data model changes  
**Testing**: Jest + ts-jest (Lambda); CDK infrastructure exempt per Constitution §X  
**Target Platform**: AWS us-east-1 — SES, Route53, Lambda  
**Project Type**: Infrastructure config change + Lambda env var update  
**Performance Goals**: No new targets — email delivery latency unchanged  
**Constraints**: SES sandbox vs. production mode must be verified; beatsontheblockfest.com hosted zone already exists in Route53 (DnsStack)  
**Scale/Scope**: Affects all 3 environments (dev, staging, prod) — SES identity is account-level

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Stack Fidelity | ✅ Pass | SES already in use; adding domain identity + DNS records, no new services |
| II. Simplicity First | ✅ Pass | Minimal change — CDK EmailIdentity + 4 DNS records + 2 env var updates |
| III. Environment Discipline | ✅ Pass | Prod gets `info@beatsontheblockfest.com`; staging/dev/PR keep `productions.connectatlanta@gmail.com` as CONTACT_EMAIL |
| IV. DynamoDB Is Source of Truth | ✅ Pass | No data model changes |
| V. Security Boundaries | ✅ Pass | No secrets involved; SES identity is infra, not a credential |
| VI. Lambda Handler Pattern | ✅ Pass | No handler code changes — env vars only |
| VII. Frontend Static Export | ✅ Pass | No frontend changes |
| VIII. CDK Infrastructure as Code | ✅ Pass | SES identity and DNS records added via CDK; no console changes |
| IX. Code Quality | ✅ Pass | No new code; existing types unchanged |
| X. Testing Standards | ✅ Pass | No new Lambda logic; existing tests unaffected |
| XI. UX Consistency | ✅ Pass | No UI changes |
| XII. Performance Requirements | ✅ Pass | No media or caching changes |

All gates pass. No violations to document.

## Project Structure

### Documentation (this feature)

```text
specs/005-switch-email-domain/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (files changed by this feature)

```text
infrastructure/
├── bin/app.ts                          # No changes
└── lib/stacks/
    ├── dns-stack.ts                    # ADD: SES EmailIdentity, SPF, DMARC, MX for beatsontheblockfest.com
    └── backend-stack.ts                # UPDATE: FROM_EMAIL, contactEmail default, CORS origins

lambda/
└── src/lib/
    └── formShared.ts                   # No changes (FROM_EMAIL/CONTACT_EMAIL come from env vars)
```

No new files are created. No data model changes. No frontend changes. No Lambda handler logic changes.
