# Implementation Plan: SendGrid Email Authentication DNS Records

**Branch**: `003-sendgrid-dns-auth` | **Date**: 2026-04-29 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/003-sendgrid-dns-auth/spec.md`

## Summary

Add 4 DNS records to the existing Route53 hosted zone (`ConnectDnsStack`) via CDK to authenticate PeerPop/SendGrid email campaigns for connectevents.co: 3 CNAME records (SendGrid email tracking subdomain + 2 DKIM keys) and 1 DMARC TXT record. This is a pure CDK infrastructure change with no Lambda, frontend, or DynamoDB involvement.

## Technical Context

**Language/Version**: TypeScript 5.x (CDK infrastructure only)  
**Primary Dependencies**: `aws-cdk-lib` v2 — `aws_route53.CnameRecord`, `aws_route53.TxtRecord`  
**Storage**: N/A  
**Testing**: CDK infrastructure code is exempt from unit tests per Principle X  
**Target Platform**: AWS Route53 — `connectevents.co` hosted zone  
**Project Type**: Infrastructure (CDK stack update)  
**Performance Goals**: DNS propagation completes within 48 hours (industry standard TTL)  
**Constraints**: Record values are fixed by SendGrid — must match exactly as provided; no deviation  
**Scale/Scope**: 4 records added to 1 existing hosted zone; single CDK stack deployment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Stack Fidelity | ✅ Pass | Adding records to existing Route53 hosted zone via CDK — no new services |
| II. Simplicity First | ✅ Pass | 4 DNS records, no abstractions, no configuration for hypothetical needs |
| III. Environment Discipline | ✅ Pass | DNS is a production-only concern; Route53 hosted zone is shared (no per-env variant needed) |
| VIII. CDK Infrastructure as Code | ✅ Pass | All changes go through CDK — no manual console changes |
| X. Testing Standards | ✅ Pass | CDK infrastructure code is explicitly exempt from unit tests |
| All others | ✅ N/A | No Lambda, frontend, DynamoDB, auth, or UI changes |

No violations. No Complexity Tracking required.

## Project Structure

### Documentation (this feature)

```text
specs/003-sendgrid-dns-auth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
infrastructure/
└── lib/
    └── stacks/
        └── dns-stack.ts   # ONLY FILE CHANGED — add 4 DNS records here
```

No other files require changes. No new files need to be created in the source tree.
