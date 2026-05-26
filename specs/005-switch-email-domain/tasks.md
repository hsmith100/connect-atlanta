---

description: "Task list for 005-switch-email-domain"
---

# Tasks: Switch Email Domain to beatsontheblockfest.com

**Input**: Design documents from `/specs/005-switch-email-domain/`  
**Branch**: `005-switch-email-domain`

**Tests**: No new Lambda handlers, lib utilities, or frontend components with logic are introduced — CDK infrastructure code is exempt per Constitution §X. No test tasks generated.

**Organization**: Tasks grouped by user story — foundational DNS phase first (blocks all stories), then story-specific implementation and verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Foundational — beatsontheblockfest.com Email DNS Records

**Purpose**: Add all missing email DNS records and SES domain identity for beatsontheblockfest.com. All three user stories depend on this phase completing first.

**⚠️ CRITICAL**: No user story work can begin until T007 (ConnectDnsStack deployed) is confirmed complete.

**Files changed**: `infrastructure/lib/stacks/dns-stack.ts` only

- [x] T001 Add `import * as ses from 'aws-cdk-lib/aws-ses'` at the top of `infrastructure/lib/stacks/dns-stack.ts` and add an `aws_ses.EmailIdentity` construct for `beatsontheblockfest.com` using `ses.Identity.domain('beatsontheblockfest.com')` with `DkimSigningConfig.defaultValue()`; then loop over `emailIdentity.dkimRecords` to add the 3 SES DKIM CNAME records into `beatsontheblockfestHostedZone` in `infrastructure/lib/stacks/dns-stack.ts`
- [x] T002 Add a `new route53.TxtRecord` for Google Workspace DKIM with `recordName: 'google._domainkey'` and value `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo9MM/iEqLqpHOsayx4y1FO9QuYpNGod4AJ2s4LvvPxZ65lbY4FqCDeH2SlKQZiLFz2+S8JJbDi2eAPKzV61o99rHbK+B9ZZuK6D3MxShHJlXms8PNY2JdOfD3xbj3K4HmikoXqLlQoGDfO/ZkGeBymBZ7IuQDHCyDTk1+uAZj5ucz6zkTz0zEn5gCwN68boQ2yH0djK3yIf19hNtXFhA3g1uT8A+quJUjaoM9pGBEkOKMYaCGNpf4vsFb2gQSR51KowmkPlKQnYRJvUWOccdSZaBHRb23U+2fvHhB9lJZPvYCKAvRkP3tPqP8DfKF5HmYvIt+/PgiDdPrDXNpylTtQIDAQAB` attached to `beatsontheblockfestHostedZone` in `infrastructure/lib/stacks/dns-stack.ts`
- [x] T003 Add a `new route53.MxRecord` for `beatsontheblockfestHostedZone` with the same five Google Workspace mail server entries used for `connectevents.co` (priorities 1/5/5/10/10: aspmx.l.google.com, alt1–alt2.aspmx.l.google.com, alt3–alt4.aspmx.l.google.com) in `infrastructure/lib/stacks/dns-stack.ts`
- [x] T004 Add a `new route53.TxtRecord` for SPF with value `v=spf1 include:amazonses.com include:_spf.google.com ~all` (no `recordName` — apex record) attached to `beatsontheblockfestHostedZone` in `infrastructure/lib/stacks/dns-stack.ts`
- [x] T005 Add a `new route53.TxtRecord` for DMARC with `recordName: '_dmarc'` and value `v=DMARC1; p=none;` attached to `beatsontheblockfestHostedZone` in `infrastructure/lib/stacks/dns-stack.ts`
- [x] T006 Run `npx cdk synth ConnectDnsStack` from `infrastructure/` to confirm TypeScript compiles cleanly and the changeset includes: SES EmailIdentity, 3 SES DKIM CNAMEs, Google Workspace DKIM TXT, MX, SPF TXT, DMARC TXT
- [ ] T007 Deploy ConnectDnsStack with `npx cdk deploy ConnectDnsStack --require-approval always` from `infrastructure/`; after deploy, run `aws ses get-identity-verification-attributes --identities beatsontheblockfest.com --region us-east-1` and confirm `"VerificationStatus": "Success"` (wait up to 10 minutes for DNS propagation if still Pending)

**Checkpoint**: ConnectDnsStack deployed and SES verification confirmed — all three user stories can now proceed

---

## Phase 2: User Story 1 — Form Confirmations Send from noreply@beatsontheblockfest.com (Priority: P1) 🎯 MVP

**Goal**: All automated form confirmation emails use `noreply@beatsontheblockfest.com` as the FROM address and all admin notifications route to `info@beatsontheblockfest.com`

**Independent Test**: Submit the contact form on staging and verify the confirmation email From: header shows `noreply@beatsontheblockfest.com`

**Files changed**: `infrastructure/lib/stacks/backend-stack.ts` only

- [x] T008 [US1] Change the hardcoded `FROM_EMAIL: 'noreply@connectevents.co'` to `FROM_EMAIL: 'noreply@beatsontheblockfest.com'` in the `formsLambda` environment object in `infrastructure/lib/stacks/backend-stack.ts` (around line 110)
- [x] T009 [US1] Change the `contactEmail` default prop value from `'info@connectevents.co'` to `'info@beatsontheblockfest.com'` in the `BackendStackProps` destructuring in `infrastructure/lib/stacks/backend-stack.ts` (around line 37)
- [x] T010 [US1] Add `'https://beatsontheblockfest.com'` and `'https://www.beatsontheblockfest.com'` to the CORS `allowedOrigins` array in the non-ephemeral branch in `infrastructure/lib/stacks/backend-stack.ts` (around line 167)
- [x] T011 [US1] Run `npx cdk synth ConnectBackendStack` from `infrastructure/` to confirm TypeScript compiles cleanly and diff shows only env var and CORS changes
- [ ] T012 [US1] Deploy ConnectStagingBackendStack with `npx cdk deploy ConnectStagingBackendStack --require-approval always` from `infrastructure/`
- [ ] T013 [US1] Submit a test DJ application or contact form on the staging site (`https://d36pa7dr4nksf5.cloudfront.net`) and verify: (a) confirmation email arrives in the submitter's inbox from `noreply@beatsontheblockfest.com`, (b) no connectevents.co references in the From header, (c) email lands in primary inbox not spam

**Checkpoint**: User Story 1 independently verified on staging — form confirmations branded correctly

---

## Phase 3: User Story 2 — updates@ Emails Land in Inbox, Not Spam (Priority: P2)

**Goal**: Emails sent from `updates@beatsontheblockfest.com` via Google Workspace pass spam filters and land in primary inbox

**Independent Test**: Send a test email from `updates@beatsontheblockfest.com` to an external Gmail account and confirm primary inbox delivery with no warnings

**No code changes** — this story is resolved by the DNS records deployed in Phase 1

- [ ] T014 [US2] Send 3 test emails from `updates@beatsontheblockfest.com` (via Google Workspace) to separate external accounts (at least one Gmail, one Outlook) and confirm all land in the primary inbox — not the spam folder
- [ ] T015 [US2] Open one of the received test emails, view the full headers, and confirm DKIM signature passes (`dkim=pass`), SPF passes (`spf=pass`), and DMARC passes (`dmarc=pass`)

**Checkpoint**: User Story 2 verified — updates@ emails are inbox-deliverable

---

## Phase 4: User Story 3 — info@ Sending and Receiving Work (Priority: P3)

**Goal**: The `info@beatsontheblockfest.com` Google Workspace inbox can send and receive email

**Independent Test**: Send a test email to `info@beatsontheblockfest.com` from an external account and confirm it appears in the inbox; then send one from `info@` and confirm external delivery

**No code changes** — this story is resolved by the MX and SPF/DKIM DNS records deployed in Phase 1

- [ ] T016 [US3] Send a test email to `info@beatsontheblockfest.com` from an external Gmail or Outlook account and confirm it appears in the Google Workspace inbox within 5 minutes
- [ ] T017 [US3] Send a test email from `info@beatsontheblockfest.com` via Google Workspace to an external Gmail/Outlook account and confirm delivery in the primary inbox with no spam warnings
- [ ] T018 [US3] Submit a contact form on the staging site and confirm the admin notification email arrives at `info@beatsontheblockfest.com` within 2 minutes (staging CONTACT_EMAIL is `productions.connectatlanta@gmail.com`, so verify admin notification there; production will route to `info@beatsontheblockfest.com`)

**Checkpoint**: All three user stories independently verified — proceed to production deployment

---

## Phase 5: Polish & Production Deploy

**Purpose**: Ship to production and clean up stale comments

- [ ] T019 Deploy ConnectBackendStack to production with `npx cdk deploy ConnectBackendStack --require-approval always` from `infrastructure/`
- [ ] T020 Submit a test form on the production site (`https://beatsontheblockfest.com`) and verify confirmation email arrives from `noreply@beatsontheblockfest.com` in the primary inbox
- [x] T021 Update the stale inline comment on the SES IAM policy in `infrastructure/lib/stacks/backend-stack.ts` (around line 121) from `"SES send permission — domain verification happens in Phase 5 cutover"` to `"SES send permission — beatsontheblockfest.com and connectevents.co verified in ConnectDnsStack"`
- [ ] T022 Run `npm test && npm run lint` from repo root to confirm all CI checks pass before raising PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately. BLOCKS all user stories.
- **US1 (Phase 2)**: Depends on T007 (SES EmailIdentity verified) — needs SES to accept `noreply@beatsontheblockfest.com` sends
- **US2 (Phase 3)**: Depends on T007 (SPF/DKIM DNS records live)
- **US3 (Phase 4)**: Depends on T007 (MX/SPF/DKIM DNS records live)
- **Polish (Phase 5)**: Depends on Phases 2–4 verified

### Within Phase 1

```
T001 → T002 → T003 → T004 → T005   (sequential edits to dns-stack.ts)
                                    ↓
                               T006 (synth)
                                    ↓
                               T007 (deploy + verify)
```

### User Story Dependencies

- **US1 (Phase 2)**: Needs T007 complete (SES verification) — T008–T013 are then sequential in the same file
- **US2 (Phase 3)**: Needs T007 complete — T014–T015 are then independent verifications
- **US3 (Phase 4)**: Needs T007 complete — T016–T018 are then independent verifications
- Phases 3 and 4 can run in parallel after Phase 1 completes

### Parallel Opportunities

```
# After T007 completes, Phases 2, 3, and 4 can begin simultaneously:
Phase 2 (US1):   T008 → T009 → T010 → T011 → T012 → T013
Phase 3 (US2):   T014 → T015
Phase 4 (US3):   T016 → T017 → T018
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational DNS + SES (T001–T007)
2. Complete Phase 2: US1 backend-stack changes + staging verification (T008–T013)
3. **STOP and VALIDATE**: Confirm form confirmations arrive from `noreply@beatsontheblockfest.com`
4. Proceed to US2/US3 verifications then production deploy

### Incremental Delivery

1. Phase 1 → Foundation live (DNS fixed, SES verified)
2. Phase 2 → US1 verified on staging (form confirmations branded)
3. Phases 3+4 → US2/US3 verified (updates@ out of spam, info@ working)
4. Phase 5 → Production deployed, PR merged

---

## Notes

- T001–T005 all edit `dns-stack.ts` and must be done sequentially (same file)
- T008–T010 all edit `backend-stack.ts` and must be done sequentially (same file)
- US2 and US3 are verification-only phases — the DNS changes in Phase 1 are what fix them
- Staging `CONTACT_EMAIL` is `productions.connectatlanta@gmail.com` — production is `info@beatsontheblockfest.com`
- If T007 shows SES `VerificationStatus: Pending` after 10 minutes, check that Namecheap nameservers for beatsontheblockfest.com still point to Route53 (Phase 7 of original migration)
- The [P] marker is omitted for same-file tasks even when logically independent — edit them one at a time
