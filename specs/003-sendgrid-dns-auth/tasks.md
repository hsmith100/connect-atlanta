---

description: "Task list for 003-sendgrid-dns-auth: SendGrid Email Authentication DNS Records"
---

# Tasks: SendGrid Email Authentication DNS Records

**Input**: Design documents from `/specs/003-sendgrid-dns-auth/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: CDK infrastructure code is explicitly exempt from unit tests per Principle X of the constitution. No test tasks are generated.

**Organization**: Tasks are grouped by user story. US1 (DKIM/CNAME records → inbox delivery) and US2 (DMARC monitoring) are independently deployable and verifiable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Path Conventions

- Only file modified: `infrastructure/lib/stacks/dns-stack.ts`

---

## Phase 1: Setup

**Purpose**: Confirm environment before making changes

- [ ] T001 Confirm branch `003-sendgrid-dns-auth` is checked out (`git branch --show-current`)
- [ ] T002 Read `infrastructure/lib/stacks/dns-stack.ts` and confirm no existing sendgrid or `_dmarc` DNS records are present

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish a clean CDK diff baseline before any record additions

**⚠️ CRITICAL**: Complete before any user story work begins

- [ ] T003 Run `npx cdk diff ConnectDnsStack` from the `infrastructure/` directory and confirm the output shows no unexpected changes (baseline is clean)

**Checkpoint**: Baseline confirmed — user story implementation can now begin

---

## Phase 3: User Story 1 — Marketing Emails Land in Inbox (Priority: P1) 🎯 MVP

**Goal**: Add the 3 SendGrid CNAME records that enable DKIM authentication and email link tracking for PeerPop campaigns sent from connectevents.co

**Independent Test**: After deployment, `dig CNAME em335.connectevents.co`, `dig CNAME s1._domainkey.connectevents.co`, and `dig CNAME s2._domainkey.connectevents.co` each resolve to their correct SendGrid targets

### Implementation for User Story 1

- [ ] T004 [US1] Add `SendGridEmailTracking`, `SendGridDkimKey1`, and `SendGridDkimKey2` CnameRecord constructs to `infrastructure/lib/stacks/dns-stack.ts` after the existing SpfRecord block, using the exact values from `specs/003-sendgrid-dns-auth/data-model.md`
- [ ] T005 [US1] Run `npx cdk diff ConnectDnsStack` from `infrastructure/` and confirm exactly 3 new `AWS::Route53::RecordSet` resources appear — no deletions or unexpected modifications
- [ ] T006 [US1] Deploy with `npx cdk deploy ConnectDnsStack` (review changeset before approving), then verify the 3 CNAME records resolve via `dig CNAME em335.connectevents.co`, `dig CNAME s1._domainkey.connectevents.co`, `dig CNAME s2._domainkey.connectevents.co`

**Checkpoint**: US1 complete — 3 CNAME records live and resolving. PeerPop DKIM verification can now proceed.

---

## Phase 4: User Story 2 — Domain Reputation Monitoring via DMARC (Priority: P2)

**Goal**: Add the DMARC TXT record at `_dmarc.connectevents.co` to establish a monitoring-only email policy for the domain

**Independent Test**: `dig TXT _dmarc.connectevents.co` returns `v=DMARC1; p=none;`

### Implementation for User Story 2

- [ ] T007 [US2] Add `DmarcRecord` TxtRecord construct to `infrastructure/lib/stacks/dns-stack.ts` after the SendGrid CNAME block, with `recordName: '_dmarc'` and `values: ['v=DMARC1; p=none;']`
- [ ] T008 [US2] Run `npx cdk diff ConnectDnsStack` from `infrastructure/` and confirm exactly 1 new `AWS::Route53::RecordSet` resource (the DMARC record) — no changes to the 3 CNAME records already deployed
- [ ] T009 [US2] Deploy with `npx cdk deploy ConnectDnsStack`, then verify the DMARC record resolves via `dig TXT _dmarc.connectevents.co`

**Checkpoint**: US2 complete — all 4 DNS records live and resolving

---

## Phase 5: Polish & End-to-End Verification

**Purpose**: Confirm PeerPop authentication and inbox delivery with all records active

- [ ] T010 Log in to PeerPop, navigate to domain settings for connectevents.co, and click "Verify" — confirm the dashboard shows the domain as authenticated (allow up to 48h for full propagation if needed)
- [ ] T011 Send a test campaign email from PeerPop to a personal Gmail or Outlook inbox and confirm it lands in the primary inbox with no spam warning (validates SC-002 from spec.md)
- [ ] T012 [P] Verify no regression in SES transactional mail: confirm a form submission on connectevents.co still triggers a notification email to info@connectevents.co (validates SC-004 from spec.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user story work
- **US1 (Phase 3)**: Depends on Foundational — no dependency on US2
- **US2 (Phase 4)**: Depends on Foundational — no dependency on US1; can be added to the same file edit and deployed in one pass with US1 if desired, but is independently testable
- **Polish (Phase 5)**: Depends on both US1 and US2 being deployed

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Phase 2. No dependency on US2.
- **User Story 2 (P2)**: Starts after Phase 2. No dependency on US1 (DMARC record is independent).

### Within Each User Story

- Edit dns-stack.ts → diff to verify → deploy → DNS verify
- No model/service/endpoint ordering needed (infrastructure-only change)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (baseline diff)
3. Complete Phase 3: US1 (3 CNAME records deployed)
4. **STOP and VALIDATE**: PeerPop should show DKIM authentication verified
5. Send a test campaign — if it lands in inbox, MVP is done

### Incremental Delivery

Since both user stories modify the same file, the most efficient path is:

1. Phases 1–2: Setup and baseline
2. Edit dns-stack.ts with all 4 records at once (T004 + T007 in a single edit)
3. Single `cdk deploy ConnectDnsStack` with 4 new records in the changeset
4. Verify all records via `dig`
5. Verify in PeerPop and send test campaign

### One-at-a-Time Strategy (Safest)

1. Phases 1–2 → T004–T006 (US1 deployed, verified)
2. T007–T009 (US2 deployed, verified)
3. T010–T012 (end-to-end verification)

---

## Notes

- CDK infrastructure code is exempt from unit tests (Principle X) — no test tasks
- All 4 records live in `infrastructure/lib/stacks/dns-stack.ts` — only file changed
- Staging/dev stacks are unaffected (no hosted zone in those environments)
- DNS propagation can take up to 48 hours; `dig` output may be empty immediately after deploy
- The DMARC `p=none` policy is monitor-only — no mail is blocked or rejected by this change
- Exact record values are in `specs/003-sendgrid-dns-auth/data-model.md`
