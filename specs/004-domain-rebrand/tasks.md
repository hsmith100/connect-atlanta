# Tasks: Domain Rebrand — connectevents.co → beatsontheblockfest.com

**Input**: Design documents from `/specs/004-domain-rebrand/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: CDK infrastructure code is explicitly exempt from unit tests per Constitution Principle X. No test tasks generated.

**Organization**: Single PR on `004-domain-rebrand`. DnsStack is written and deployed from the branch mid-way (the production pipeline never deploys ConnectDnsStack, so branch vs. main doesn't matter). Once the cert is validated, FrontendStack code is written and the PR is opened. When it merges, the production pipeline deploys FrontendStack with the cert already in place.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- CDK infrastructure changes only — no Lambda, frontend, or DynamoDB files touched

---

## Phase 1: DnsStack — new hosted zone + certificate

**Purpose**: Add the beatsontheblockfest.com hosted zone and ACM certificate to `dns-stack.ts`. Purely additive — nothing existing is modified. The live site has zero downtime.

- [x] T001 Add `public readonly beatsontheblockfestHostedZone: route53.HostedZone` property and `new route53.HostedZone(this, 'BeatsHostedZone', { zoneName: 'beatsontheblockfest.com' })` construct plus a `CfnOutput` exporting the four Route53 nameservers (using `cdk.Fn.join`) to `infrastructure/lib/stacks/dns-stack.ts`

- [x] T002 Add `public readonly beatsontheblockfestCertificate: acm.Certificate` property and `new acm.Certificate(this, 'BeatsCertificate', { domainName: 'beatsontheblockfest.com', subjectAlternativeNames: ['www.beatsontheblockfest.com'], validation: acm.CertificateValidation.fromDns(this.beatsontheblockfestHostedZone) })` construct plus a `CfnOutput` for the cert ARN to `infrastructure/lib/stacks/dns-stack.ts`

- [x] T003 Run `cd infrastructure && npx cdk synth ConnectDnsStack` and fix any TypeScript errors

- [x] T004 Deploy `ConnectDnsStack` from the feature branch: `npx cdk deploy ConnectDnsStack --require-approval never`; while CDK blocks on cert validation, get the beatsontheblockfest.com nameservers from CloudFormation output `BeatsNameServers` and update Namecheap (Domain List → beatsontheblockfest.com → Manage → Nameservers → Custom DNS); wait for cert validation and deploy completion (see quickstart.md Phase A for exact steps)

**⛔ STOP**: Do not continue until T004 is fully complete and the cert is validated. Then resume with Phase 2.

---

## Phase 2: User Story 1 + 3 — New Domain Serving Over HTTPS (Priority: P1 / P2)

**Goal**: beatsontheblockfest.com and www.beatsontheblockfest.com serve the full site over HTTPS using the same S3 bucket and API Gateway origin as connectevents.co.

**Independent Test**: `curl -I https://beatsontheblockfest.com` returns HTTP 200 with valid TLS; deep paths and `/api/*` work correctly. See quickstart.md Tests 1 and 3.

- [x] T005 [US1] Add `BeatsCDN` CloudFront distribution inside the `if (isProd && dnsStack)` block in `infrastructure/lib/stacks/frontend-stack.ts` — use the existing `s3Origin` and `oai`, replicate the `additionalBehaviors` `/api/*` block and `errorResponses` from the existing `CDN` distribution, apply `rewriteFunction` at VIEWER_REQUEST, set `certificate: dnsStack.beatsontheblockfestCertificate`, `domainNames: ['beatsontheblockfest.com', 'www.beatsontheblockfest.com']`, `defaultRootObject: 'index.html'`, and `viewerProtocolPolicy: REDIRECT_TO_HTTPS`; add `CfnOutput` for `BeatsCloudFrontDistributionId` and `BeatsCloudFrontUrl`

- [x] T006 [US1] Add Route53 `ARecord` and `AaaaRecord` for apex `beatsontheblockfest.com` (no `recordName`) and `ARecord` + `AaaaRecord` for `www.beatsontheblockfest.com` (recordName: `'www'`), all pointing to `BeatsCDN` via `route53Targets.CloudFrontTarget`, using `dnsStack.beatsontheblockfestHostedZone` — all four records inside the `if (isProd && dnsStack)` block in `infrastructure/lib/stacks/frontend-stack.ts`

---

## Phase 3: User Story 2 — connectevents.co Permanent Redirect (Priority: P2)

**Goal**: All HTTP and HTTPS requests to connectevents.co (apex and www) return a 301 redirect to the equivalent URL on beatsontheblockfest.com with path and query string preserved.

**Independent Test**: `curl -I https://connectevents.co/join` returns HTTP 301 with `Location: https://beatsontheblockfest.com/join`. See quickstart.md Test 2.

- [x] T007 [US2] Add `RedirectFunction` CloudFront Function construct (`new cloudfront.Function(this, 'RedirectFunction', { runtime: cloudfront.FunctionRuntime.JS_2_0, code: cloudfront.FunctionCode.fromInline(...) })`) to `infrastructure/lib/stacks/frontend-stack.ts` — the inline JS must return a 301 response with `Location: https://beatsontheblockfest.com + request.uri + serialized querystring`; use the full function implementation from research.md (preserves multi-value params); place the construct before the existing `CDN` distribution

- [x] T008 [US2] Update the existing `CDN` distribution's `defaultBehavior.functionAssociations` in `infrastructure/lib/stacks/frontend-stack.ts`: replace the static `rewriteFunction` reference with `isProd ? redirectFunction : rewriteFunction` — connectevents.co redirects in prod; staging/dev continue to serve normally

---

## Phase 4: Open PR + Deploy + Acceptance Testing

- [x] T009 Run `cd infrastructure && npx cdk synth` and `npm run lint` — fix any errors before opening the PR

- [ ] T010 Open PR for `004-domain-rebrand` → ephemeral deploy runs (inert — PR envs have no `dnsStack`, so new code does not execute); get PR reviewed and merged

- [ ] T011 Confirm production pipeline deploys `ConnectFrontendStack` successfully after merge

- [ ] T012 [US1] Run quickstart.md Test 1 — verify `beatsontheblockfest.com`, `www.beatsontheblockfest.com`, and `beatsontheblockfest.com/join` all return HTTP 200 over HTTPS with no certificate errors

- [ ] T013 [US3] Run quickstart.md Test 3 — verify HTTPS certificate is valid on beatsontheblockfest.com; confirm `http://beatsontheblockfest.com` redirects to HTTPS

- [ ] T014 [US2] Run quickstart.md Test 2 — verify `connectevents.co`, `www.connectevents.co`, and `connectevents.co/join` all return HTTP 301 with correct `Location` header; verify query strings are preserved

- [ ] T015 Run quickstart.md Test 4 (SC-004 acceptance gate) — send a test email to `info@connectevents.co` from an external address and confirm receipt in Google Workspace

- [ ] T016 Run quickstart.md Test 5 — run `dig` commands to verify connectevents.co MX, SPF, DMARC, and SendGrid DKIM CNAMEs are all unchanged

---

## Dependencies & Execution Order

- T001 → T002 (cert references the hosted zone)
- T001, T002 → T003 → T004 (synth before deploy)
- **T004 must complete before T005** (cert CloudFormation export must exist before FrontendStack references it)
- T005 → T006 (Route53 records reference BeatsCDN)
- T007 → T008 (CDN update references RedirectFunction)
- T005–T008, T009 → T010 (PR open) → T011 → T012–T016

---

## Notes

- No Lambda, frontend, or DynamoDB changes — CDK only
- No unit tests required (CDK infrastructure exempt per Constitution Principle X)
- T004 is deployed from the feature branch — ConnectDnsStack is never deployed by CI so branch doesn't matter
- connectevents.co DNS records are never modified — only the CloudFront distribution's function changes (FR-007)
- Rollback: revert frontend-stack.ts and redeploy ConnectFrontendStack; email unaffected by any rollback
