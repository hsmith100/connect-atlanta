---
description: "Task list for restoring the Merch nav tab and updating the merch page for the Bonfire store"
---

# Tasks: Restore Merch Tab with Bonfire Store

**Input**: Design documents from `/specs/001-show-merch-tab/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅

**Tests**: Per Principle X of the constitution, unit tests are required for all components with logic. Test tasks are included for `Header.tsx` and `MerchGrid.tsx`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup (Pre-Code Data Collection)

**Purpose**: Collect the Bonfire product data required before any code changes can be made. No code is written in this phase.

- [ ] T001 Browse `https://www.bonfire.com/store/beats-on-the-block/` and record each product's name, price, and individual product page URL in a scratch note
- [ ] T002 [P] Right-click a product image on the Bonfire store, copy the image URL, and record the CDN hostname (e.g. `cdn.bonfire.com`) needed for `next.config.js`

**Checkpoint**: You have a list of all current Bonfire products with names, prices, image URLs, product page URLs, and the CDN hostname. No code changes made yet.

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Allowlist the Bonfire image CDN so `<Image>` renders correctly — required before US2 images can be tested.

**⚠️ CRITICAL**: US2 image rendering depends on this being complete first.

- [x] T003 Add the Bonfire CDN hostname (from T002) to `remotePatterns` in `frontend/next.config.js`, following the existing `img.youtube.com` pattern

**Checkpoint**: Foundation ready — US1 and US2 can now be implemented (in parallel or sequentially).

---

## Phase 3: User Story 1 — Find Merch from Navigation (Priority: P1) 🎯 MVP

**Goal**: "Merch" link appears in the site nav on every page (desktop and mobile) and routes to `/merch`.

**Independent Test**: Visit any page in the dev environment, confirm "Merch" appears between "Join Us" and "Contact" in the desktop nav bar; open the hamburger menu on mobile and confirm "Merch" is listed; click the link and confirm it routes to `/merch`.

### Implementation for User Story 1

- [x] T004 [US1] Add a `<Link href="/merch">Merch</Link>` entry between "Join Us" and "Contact" in the desktop nav block (`hidden md:flex`) in `frontend/components/layout/Header.tsx`
- [x] T005 [US1] Add a matching `<Link href="/merch">` entry between "Join Us" and "Contact" in the mobile menu dropdown block in `frontend/components/layout/Header.tsx` (include `onClick={closeMobileMenu}` and matching block/hover classes)

### Tests for User Story 1

- [x] T006 [US1] Add `expect(screen.getByText('Merch')).toBeInTheDocument()` to the `'renders all navigation links'` test in `frontend/components/layout/Header.test.tsx`

**Checkpoint**: User Story 1 is independently testable. Run `cd frontend && npm test -- --ci --testPathPattern=Header` to confirm passing.

---

## Phase 4: User Story 2 — Browse and Buy Current Merch (Priority: P1)

**Goal**: `/merch` page shows a product card grid with Bonfire-hosted images, names, prices, per-product Bonfire links, and a "Shop All" CTA — with zero Fourthwall links remaining.

**Independent Test**: Load `/merch`, confirm product cards render with images; click a card and confirm it opens the correct Bonfire product page in a new tab; confirm the "Shop All" / "Visit the Store" link points to `https://www.bonfire.com/store/beats-on-the-block/`; confirm no `fourthwall.com` links appear anywhere on the page.

### Implementation for User Story 2

- [x] T007 [US2] Delete `frontend/components/merch/__snapshots__/MerchGrid.test.tsx.snap` so the snapshot regenerates cleanly after the component is updated
- [x] T008 [US2] Replace the `MERCH_ITEMS` array in `frontend/components/merch/MerchGrid.tsx` with the current Bonfire products collected in T001 — each item has `name`, `price`, `image` (Bonfire CDN URL), and `url` (individual Bonfire product page URL)
- [x] T009 [US2] Update the "Shop All" section below the product grid in `frontend/components/merch/MerchGrid.tsx` — add an `<a href="https://www.bonfire.com/store/beats-on-the-block/" target="_blank" rel="noopener noreferrer">` CTA link ("Shop All on Bonfire" or similar) to the existing promo block

### Tests for User Story 2

- [x] T010 [US2] Update `frontend/components/merch/MerchGrid.test.tsx`:
  - Replace `'renders all five merch items'` assertions with the new Bonfire product names from T001
  - Replace the `fourthwall.com` URL check with `bonfire.com`
  - Rename the test to reflect the new product count if it changed

**Checkpoint**: User Story 2 is independently testable. Run `cd frontend && npm test -- --ci --testPathPattern=MerchGrid` to confirm passing (snapshot will be regenerated).

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and final validation.

- [x] T011 Delete the five obsolete local merch image files no longer referenced by any component: `frontend/public/images/merch/whitetshirt.jpg`, `retrotee.jpg`, `discotee.jpg`, `circle sticker.png`, `blocksticker.png`
- [x] T012 Run the full frontend test suite (`cd frontend && npm test -- --ci`) and confirm all tests pass before opening a PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No code dependencies — start immediately (manual data collection)
- **Foundational (Phase 2)**: Depends on T002 (CDN hostname) — one-line change to `next.config.js`
- **US1 (Phase 3)**: Independent of Foundational; can start after Phase 1 Setup is complete
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) for image rendering; depends on T001 for product data
- **Polish (Phase 5)**: Depends on both US1 and US2 being complete

### User Story Dependencies

- **US1 (T004–T006)**: Can start after T001 — no dependency on Foundational
- **US2 (T007–T010)**: Depends on T001 (product data) and T003 (CDN allowlist)
- US1 and US2 touch different files and can proceed in parallel once their prerequisites are met

### Within Each User Story

- US1: T004 and T005 edit the same file sequentially; T006 (test) can be written in parallel with T004/T005
- US2: T007 (delete snapshot) → T008 (update component) → T009 (update CTA) → T010 (update tests)

### Parallel Opportunities

- T001 and T002 (Phase 1) can run in parallel — same browsing session
- T003 (Foundational) and T004/T005 (US1) can run in parallel — different files
- T006 (Header test) can be written in parallel with T004/T005 (Header implementation)

---

## Parallel Example: US1 and US2

```bash
# Once T001 and T002 are complete, these can run in parallel:

# Stream A — US1 (no Foundational dependency):
T004: Add Merch link to desktop nav in Header.tsx
T005: Add Merch link to mobile menu in Header.tsx
T006: Update Header.test.tsx

# Stream B — US2 (needs T003 first):
T003: Add Bonfire CDN to next.config.js
T007: Delete MerchGrid snapshot
T008: Update MERCH_ITEMS in MerchGrid.tsx
T009: Update "Shop All" CTA in MerchGrid.tsx
T010: Update MerchGrid.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Collect Bonfire product data
2. Complete Phase 3: Add Merch nav link + update Header test
3. **STOP and VALIDATE**: Nav tab appears and routes correctly
4. Ship US1 independently if needed — `/merch` page still loads (just with old content)

### Incremental Delivery

1. Complete Setup (T001–T002) → product data in hand
2. Complete US1 (T004–T006) → Nav tab live, routes to `/merch`
3. Complete Foundational (T003) + US2 (T007–T010) → Merch page shows current Bonfire products
4. Complete Polish (T011–T012) → old images removed, all tests green
5. Open PR → dev deploy → review at dev CloudFront URL → merge → staging → production

---

## Notes

- [P] tasks = different files or independent concerns with no dependency on incomplete tasks
- T001 and T002 are manual steps — no code is written; do these before opening your editor
- The snapshot deletion (T007) must happen before running tests after T008/T009 to avoid stale snapshot failures
- Commit after T006 (US1 complete) and again after T010 (US2 complete) for clean PR history
