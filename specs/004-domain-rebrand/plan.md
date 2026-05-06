# Implementation Plan: Domain Rebrand — connectevents.co → beatsontheblockfest.com

**Branch**: `004-domain-rebrand` | **Date**: 2026-05-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-domain-rebrand/spec.md`

## Summary

Add beatsontheblockfest.com as the primary domain for the Connect Atlanta site. The existing connectevents.co CloudFront distribution has its URL-rewrite CloudFront Function replaced with a 301 redirect function (no DNS changes to connectevents.co — FR-007). A new CloudFront distribution is created for beatsontheblockfest.com, pointing to the same S3 bucket and API Gateway origin. A new Route53 hosted zone and ACM certificate for beatsontheblockfest.com are added to DnsStack. Deployment requires a manual Namecheap nameserver update for beatsontheblockfest.com between the DnsStack and FrontendStack deploys.

## Technical Context

**Language/Version**: TypeScript 5.x (CDK infrastructure only)
**Primary Dependencies**: `aws-cdk-lib` v2 — `aws_route53.HostedZone`, `aws_acm.Certificate`, `aws_cloudfront.Distribution`, `aws_cloudfront.Function`
**Storage**: N/A — no application data changes
**Testing**: CDK infrastructure code is exempt from unit tests per Constitution Principle X
**Target Platform**: AWS (Route53, ACM us-east-1, CloudFront, S3)
**Project Type**: Infrastructure change — CDK stack modifications only
**Performance Goals**: 301 redirect responses from edge (<10ms); beatsontheblockfest.com site load unchanged
**Constraints**: FR-007 — connectevents.co DNS additive-only; beatsontheblockfest.com cert requires NS update at Namecheap before it can validate; cert must be fully validated before FrontendStack deploy
**Scale/Scope**: Two CDK stack files modified, one new CloudFront distribution, one new ACM cert, one new Route53 hosted zone, one CloudFront Function replaced

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Stack Fidelity | ✅ Pass | All changes within existing AWS CDK stack; no new runtimes, managed services, or frameworks |
| II. Simplicity First | ✅ Pass | Minimum scope: one new zone, one new cert, one new distribution, one replaced CloudFront Function |
| III. Environment Discipline | ✅ Pass | Staging FrontendStack has no `dnsStack` prop — unaffected; prod deploys through existing pipeline |
| IV. DynamoDB Source of Truth | ✅ N/A | No data changes |
| V. Security Boundaries | ✅ Pass | No auth changes; existing admin key and IAM roles unchanged |
| VI. Lambda Handler Pattern | ✅ N/A | No Lambda changes |
| VII. Frontend Static Export | ✅ Pass | Next.js static export and S3 bucket unchanged; only CloudFront aliases and function updated |
| VIII. CDK Infrastructure as Code | ✅ Pass | All AWS resource changes go through CDK; no console modifications |
| IX. Code Quality | ✅ Pass | TypeScript strict; no `any`; no dead code |
| X. Testing Standards | ✅ Exempt | CDK infrastructure code is explicitly exempt per Principle X |
| XI. UX Consistency | ✅ N/A | No UI changes |
| XII. Performance | ✅ Pass | CloudFront Function redirect runs at edge; new distribution reuses same S3 + CloudFront pattern |

**Post-design re-check**: All principles still pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/004-domain-rebrand/
├── plan.md              ✅ this file
├── research.md          ✅ Phase 0 complete
├── data-model.md        ✅ Phase 1 complete
├── quickstart.md        ✅ Phase 1 complete
├── checklists/
│   └── requirements.md  ✅ spec quality checklist
└── tasks.md             (Phase 2 — /speckit.tasks)
```

### Source Code (repository root)

```text
infrastructure/
├── bin/
│   └── app.ts                          # No changes required
└── lib/
    └── stacks/
        ├── dns-stack.ts                # ADD: beatsontheblockfest.com hosted zone + ACM cert
        └── frontend-stack.ts           # ADD: new CloudFront distribution + Route53 records
                                        # REPLACE: connectevents.co CloudFront Function (rewrite → redirect)
```

**Structure Decision**: Infrastructure-only change. No `src/`, `tests/`, `frontend/`, or `lambda/` changes. All modifications are confined to two CDK stack files.

## Phase 0: Research

See [research.md](research.md) for full findings. Summary of decisions:

| Decision | Choice |
|----------|--------|
| Redirect mechanism | CloudFront Function (301) on existing connectevents.co distribution — zero DNS changes |
| New domain hosting | Separate CloudFront distribution pointing to same S3 bucket + API origin |
| Certificate strategy | Separate cert for beatsontheblockfest.com + www; existing connectevents.co cert untouched |
| CDK location | New properties on existing DnsStack class; same FrontendStack props interface |
| OAI | Reuse existing OAI for new distribution (S3 supports multiple distributions per OAI) |
| www.beatsontheblockfest.com | Alias on same distribution as apex (same behaviour as current www.connectevents.co) |
| Deployment sequence | Two-phase: DnsStack (+ Namecheap NS update + cert validation) → FrontendStack |

## Phase 1: Design

### DnsStack changes (`infrastructure/lib/stacks/dns-stack.ts`)

New public properties added:
```typescript
public readonly beatsontheblockfestHostedZone: route53.HostedZone;
public readonly beatsontheblockfestCertificate: acm.Certificate;
```

New constructs:
1. `route53.HostedZone` for `beatsontheblockfest.com`
2. `acm.Certificate` for `beatsontheblockfest.com` + `www.beatsontheblockfest.com`, DNS-validated against the new hosted zone
3. `cdk.CfnOutput` for the new hosted zone nameservers (needed for Namecheap update)
4. `cdk.CfnOutput` for the new certificate ARN

**No existing constructs are modified.**

### FrontendStack changes (`infrastructure/lib/stacks/frontend-stack.ts`)

New constructs (inside `if (isProd && dnsStack)` block):
1. `cloudfront.Function` — `RedirectFunction` — 301 redirect to beatsontheblockfest.com with path + query string preservation
2. `cloudfront.Distribution` — `BeatsCDN` — serves beatsontheblockfest.com and www; same S3 + API origins as existing distribution; uses rewrite function
3. `route53.ARecord` + `route53.AaaaRecord` — apex beatsontheblockfest.com → BeatsCDN (in new hosted zone)
4. `route53.ARecord` + `route53.AaaaRecord` — www.beatsontheblockfest.com → BeatsCDN (in new hosted zone)
5. New outputs: `BeatsCloudFrontDistributionId`, `BeatsCloudFrontUrl`

Modified constructs:
1. Existing `CDN` distribution — `functionAssociations` updated: `RewriteFunction` replaced with `RedirectFunction` when `isProd` is true

**No Route53 records in the connectevents.co hosted zone are added, removed, or modified (FR-007).**

### CloudFront Function: redirect (pseudocode)

```
handler(event):
  uri = request.uri
  queryString = serialize(request.querystring)  // preserves all params
  return 301 redirect to https://beatsontheblockfest.com + uri + queryString
```

Full implementation in research.md.

### Deployment sequence

See [quickstart.md](quickstart.md) for exact commands. High-level:
1. `cdk deploy ConnectDnsStack` — blocks on cert validation
2. Update Namecheap NS for beatsontheblockfest.com → Route53 (while step 1 is waiting)
3. Step 1 completes after cert validates (~5–10 min post-NS propagation)
4. `cdk deploy ConnectFrontendStack`
5. Run all acceptance tests from quickstart.md
6. Manually send test email to info@connectevents.co → confirm receipt (SC-004)
