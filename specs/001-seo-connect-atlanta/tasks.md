# Tasks: SEO Rebrand — Connect Atlanta Ownership Attribution

**Input**: Design documents from `/specs/001-seo-connect-atlanta/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ quickstart.md ✅

**Tests**: Constitution Principle X applies — `SEO.test.tsx` already has tests for the component defaults. Two existing tests will break after Task T001 and MUST be fixed in T002. No new test cases are required beyond fixing those broken assertions (all changed code is in presentational components or prop values; no new logic is introduced).

**Organization**: Tasks grouped by user story to enable independent delivery and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P]-marked tasks in the same phase (different files)
- **[Story]**: Maps to user story from spec.md

---

## Phase 1: Setup

No setup required — this feature is entirely edits to existing files in an already-bootstrapped project.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Update the shared SEO component defaults — every other task depends on this being done first, as it removes "Atlanta EDM Festival" from the fallback title that affects all pages simultaneously.

**⚠️ CRITICAL**: All user story work is blocked until T001 and T002 are complete.

- [x] T001 Update default `title`, `description`, `keywords`, `author` meta, and `og:site_name` in `frontend/components/shared/SEO.tsx` — new defaults per plan.md Task 1 table
- [x] T002 Fix 2 broken default-value assertions in `frontend/components/shared/SEO.test.tsx`: update `'renders the default title'` to assert `'Beats on the Block'` (not `'Connect Events'`) and `'renders the default description meta tag'` to assert `'Connect Atlanta'` (not `"Atlanta's premier FREE"`)

**Checkpoint**: Run `npm test -- --ci --prefix frontend` — all tests must pass before proceeding.

---

## Phase 3: User Story 1 — Structured Data Ownership Attribution (Priority: P1) 🎯 MVP

**Goal**: Search engines and AI models (Gemini, ChatGPT) can identify Connect Atlanta as the organizer of Beats on the Block from machine-readable structured data on the two most-scraped pages.

**Independent Test**: View page source on the deployed PR environment for `/` and `/events`. Each must contain a `<script type="application/ld+json">` block with `@type: Organization` and `name: Connect Atlanta`. Validate at https://search.google.com/test/rich-results using the PR CloudFront URL.

### Implementation for User Story 1

- [x] T003 [P] [US1] Add `structuredData` prop to `<SEO>` in `frontend/pages/index.tsx` — pass `@graph` JSON-LD object containing `Organization` (Connect Atlanta, with `sameAs` social links), `EventSeries` (Beats on the Block, `organizer: { @id }`) and `WebSite` (publisher: `{ @id }`). Also update `keywords` prop: remove `'atlanta edm'`, add `'connect atlanta'`. Use canonical `@id`: `https://beatsontheblockfest.com/#org`. Refer to `research.md` for exact JSON-LD templates.
- [x] T004 [P] [US1] Add `structuredData` via `useMemo` in `frontend/pages/events.tsx` — derive value from `upcomingEvents` state; `@graph` must contain `Organization` (same `@id` as T003) plus one `MusicEvent` per upcoming event (each with `organizer: { @id }`, `location`, `startDate`, `eventStatus`, `eventAttendanceMode`). Pass to existing `<SEO>` call. Also update `<SEO>` `description` prop to name Connect Atlanta as organizer.

**Checkpoint**: Page source on `/` and `/events` (PR env) shows JSON-LD with `name: "Connect Atlanta"`. Rich Results Test passes for `Organization` type.

---

## Phase 4: User Story 2 — Remove Atlanta EDM from All Page Metadata (Priority: P2)

**Goal**: No page title, description, or keyword metadata on the site contains "Atlanta EDM Festival", "atlanta edm", or "edm atlanta" in an organizational identity context. Every page now attributes Beats on the Block to Connect Atlanta in its description.

**Independent Test**: After deploy, run `grep -r "Atlanta EDM\|atlanta edm\|edm atlanta" frontend/pages/ frontend/components/shared/SEO.tsx` — zero matches in SEO metadata. Inspect page source of all 9 pages and confirm descriptions name Connect Atlanta.

### Implementation for User Story 2

All tasks in this phase touch different files and can run in parallel.

- [x] T005 [P] [US2] Update `description` prop on `<SEO>` in `frontend/pages/gallery.tsx` — new value: `"Browse photos from Beats on the Block events, produced by Connect Atlanta — Atlanta's premier free outdoor music festival."`
- [x] T006 [P] [US2] Update `description` prop on `<SEO>` in `frontend/pages/join.tsx` — new value: `"Join the Beats on the Block crew. Apply as a volunteer, vendor, or DJ for Connect Atlanta's free outdoor music festival on the Atlanta BeltLine."`
- [x] T007 [P] [US2] Update `description` prop on `<SEO>` in `frontend/pages/contact.tsx` — new value: `"Get in touch with Connect Atlanta, organizers of Beats on the Block. Reach out about partnerships, performances, or general inquiries."`
- [x] T008 [P] [US2] Update `description` prop on `<SEO>` in `frontend/pages/merch.tsx` — new value: `"Shop official Beats on the Block merchandise from Connect Atlanta. Festival apparel, accessories, and more."`
- [x] T009 [P] [US2] Update `description` prop on `<SEO>` in `frontend/pages/sponsor-inquiries.tsx` — new value: `"Partner with Connect Atlanta to sponsor Beats on the Block — Atlanta's premier free outdoor music festival reaching 5,000–10,000 attendees."`
- [x] T010 [P] [US2] Update `description` prop on `<SEO>` in `frontend/pages/cookie-policy.tsx` — new value: `"Learn how Connect Atlanta uses cookies and similar technologies on the Beats on the Block website."`
- [x] T011 [P] [US2] Update `description` prop on `<SEO>` in `frontend/pages/privacy-policy.tsx` — new value: `"Connect Atlanta's privacy policy for the Beats on the Block website."`
- [x] T012 [P] [US2] Update `description` prop on `<SEO>` in `frontend/pages/terms-conditions.tsx` — new value: `"Terms and conditions for the Beats on the Block website, operated by Connect Atlanta."`
- [x] T013 [P] [US2] Update `title` and `description` props on `<SEO>` in `frontend/pages/404.tsx` — title: `"Page Not Found | Beats on the Block"`, description: `"The page you're looking for doesn't exist. Head back to the Beats on the Block homepage — produced by Connect Atlanta."`

**Checkpoint**: `grep -r "Atlanta EDM\|atlanta edm\|edm atlanta" frontend/pages/ frontend/components/shared/SEO.tsx` returns zero matches in metadata context. All 9 page descriptions name Connect Atlanta.

---

## Phase 5: User Story 3 — Polish & Final Validation (Priority: P3)

**Goal**: Confirm all page titles lead with "Beats on the Block" and Connect Atlanta attribution is consistent across the full site. No regressions.

**Independent Test**: Run `npm test -- --ci --prefix frontend` — all tests pass. Inspect `<title>` on every public page: each must begin with "Beats on the Block" or contain it prominently.

### Implementation for User Story 3

- [x] T014 [P] [US3] Verify `title` props on `frontend/pages/gallery.tsx`, `frontend/pages/join.tsx`, `frontend/pages/contact.tsx`, `frontend/pages/merch.tsx`, `frontend/pages/sponsor-inquiries.tsx` all follow the `"[Section] | Beats on the Block"` pattern — update any that deviate
- [x] T015 [US3] Run full validation from `quickstart.md`: confirm `og:site_name="Connect Atlanta"` and `<meta name="author" content="Connect Atlanta">` on all pages by inspecting page source on the PR environment
- [x] T016 Pre-PR validation gate (Principle XIII): run `npm test -- --ci` in `frontend/` and `npm run lint` in `frontend/` — all checks MUST pass before opening PR. Lambda checks exempt — no Lambda code changed in this feature.

**Checkpoint**: All constitution gates green. No pages contain "Atlanta EDM" in metadata. All pages attribute Connect Atlanta as organizer in descriptions. Tests and lint pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Requires Phase 2 complete (SEO component defaults must be set before structured data is added)
- **US2 (Phase 4)**: Requires Phase 2 complete — can run in parallel with Phase 3 (all different files)
- **US3 (Phase 5)**: Requires Phases 3 and 4 complete

### User Story Dependencies

- **US1 (P1)**: T003 and T004 are independent of each other [P]
- **US2 (P2)**: T005–T013 are all independent of each other [P] — 9 files, no cross-dependencies
- **US3 (P3)**: T014 independent [P]; T015 and T016 require T014 complete

### Within Each Phase

- All [P]-marked tasks within a phase can start simultaneously
- T002 should immediately follow T001 (fixes the tests that T001 breaks)

---

## Parallel Execution Examples

```bash
# Phase 2 — sequential (T002 fixes breakage from T001)
Task T001: Update SEO.tsx defaults
Task T002: Fix SEO.test.tsx assertions

# Phase 3 — parallel (different files)
Task T003: Homepage structured data (index.tsx)
Task T004: Events page structured data (events.tsx)

# Phase 4 — all parallel (9 different page files)
Task T005: gallery.tsx description
Task T006: join.tsx description
Task T007: contact.tsx description
Task T008: merch.tsx description
Task T009: sponsor-inquiries.tsx description
Task T010: cookie-policy.tsx description
Task T011: privacy-policy.tsx description
Task T012: terms-conditions.tsx description
Task T013: 404.tsx title + description
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: T001 → T002 (foundational defaults)
2. Complete Phase 3: T003 + T004 in parallel (structured data)
3. **STOP and VALIDATE**: View page source on PR env — Organization JSON-LD present on `/` and `/events`
4. Deploy: AI models and search engines now have structured data to attribute Beats on the Block to Connect Atlanta

### Incremental Delivery

1. Phase 2 → Phase 3 → **MVP deploy** — structured data ownership established
2. Phase 4 (T005–T013 in parallel) → deploy — all page descriptions name Connect Atlanta
3. Phase 5 → final validation and merge

---

## Notes

- [P] tasks = different files, no shared state, can be done simultaneously
- US1 is the highest-value delivery: structured data is what AI models (Gemini, ChatGPT) prioritize for ownership attribution
- US2 is the largest in task count but each task is a single prop value change — low complexity
- No new components, no new files, no Lambda or CDK changes
- Run `npm test -- --ci --prefix frontend` after Phase 2 and again after Phase 5 to catch regressions
