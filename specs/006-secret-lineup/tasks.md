# Tasks: Secret Lineup Reveal Page

**Input**: Design documents from `/specs/006-secret-lineup/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Per Constitution Principle X, this feature is **exempt** — the lineup page is purely presentational (no state, no API calls, no logic). No test tasks are generated.

**Organization**: Tasks grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Confirm all prerequisites are in place before building the page.

**Assets confirmed present** (no action needed):
- `frontend/public/images/Sponsor Logos 2026/2.png` — AHS "Presented By" logo ✅
- `frontend/public/images/Final Lineup.png` — performer lineup image ✅

- [x] T001 Confirm `frontend/pages/secret-lineup.tsx` does not already exist (no overwrite risk)

---

## Phase 2: Foundational (Blocking Prerequisites)

**No foundational work required.** This feature adds a single static page using existing infrastructure (Next.js, Tailwind, SEO component, Header, Footer). All dependencies already exist in the codebase.

**Checkpoint**: Ready to begin user story implementation immediately after Phase 1.

---

## Phase 3: User Story 1 — Visitor Views Secret Lineup (Priority: P1) 🎯 MVP

**Goal**: A visitor with the direct URL can access `/secret-lineup` and see the full page — AHS sponsor section followed by the performer lineup image.

**Independent Test**: Navigate to `http://localhost:3000/lineup` and confirm: page title reads "Secret Lineup", AHS logo displays, blurb text is present and complete, AHS link goes to ahsdoctors.com in a new tab, and lineup image renders with alt text.

**Note on User Story 3**: US3 (sponsor exposure for AHS) is fully delivered by this phase — the AHS logo, blurb, and link are all part of this single page implementation. No separate phase needed.

### Implementation for User Story 1

- [x] T002 [US1] Create `frontend/pages/secret-lineup.tsx` with page shell: import SEO, Header, Footer; render `<SEO title="Secret Lineup | Beats on the Block" description="The official Beats on the Block lineup, presented by Advanced Health Solutions." noindex={true} />`, `<Header />`, empty `<main>`, `<Footer />`
- [x] T003 [US1] Add "Secret Lineup" h1 heading inside `<main>` in `frontend/pages/secret-lineup.tsx` — use font-horizon and gradient text styling matching other page titles (reference `frontend/pages/merch.tsx` h1 pattern)
- [x] T004 [US1] Add AHS logo image below the title in `frontend/pages/secret-lineup.tsx` — `<img src="/images/Sponsor Logos 2026/2.png" alt="Presented by Advanced Health Solutions" />` with Tailwind classes for centered layout and appropriate max-width
- [x] T005 [US1] Add AHS sponsor blurb text in `frontend/pages/secret-lineup.tsx` below the logo — three paragraphs rendered verbatim as specified in FR-004 of spec.md, using Tailwind prose-friendly text classes
- [x] T006 [US1] Add AHS hyperlink in `frontend/pages/secret-lineup.tsx` below the blurb — `<a href="https://ahsdoctors.com" target="_blank" rel="noopener noreferrer">Visit Advanced Health Solutions</a>` with brand-appropriate link styling
- [x] T007 [US1] Add lineup image in `frontend/pages/secret-lineup.tsx` below the AHS section — `<img src="/images/Final Lineup.png" alt="Official Beats on the Block 2026 performer lineup" />` with full-width responsive Tailwind classes

**Checkpoint**: User Story 1 + User Story 3 complete. Navigate to `/secret-lineup` locally and verify all content renders correctly end-to-end.

---

## Phase 4: User Story 2 — Page Excluded from Navigation and Discovery (Priority: P2)

**Goal**: The `/secret-lineup` page exists but is invisible in all navigation surfaces and search engine results.

**Independent Test**: Browse every nav link in the site header and footer — `/secret-lineup` must not appear. View page source and confirm `<meta name="robots" content="noindex, nofollow" />` is present.

### Implementation for User Story 2

- [x] T008 [P] [US2] Audit `frontend/components/layout/Header.tsx` — confirm no link to `/secret-lineup` exists in desktop nav (lines ~81–111) or mobile nav (lines ~142–184); no change needed if absent
- [x] T009 [P] [US2] Audit `frontend/public/sitemap.xml` — confirm no `<url>` entry for `/secret-lineup` or `connectevents.co/lineup` exists; no change needed if absent
- [x] T010 [US2] Verify the SEO `noindex={true}` prop in `frontend/pages/secret-lineup.tsx` (T002) produces `<meta name="robots" content="noindex, nofollow" />` in the rendered HTML by starting the dev server (`cd frontend && npm run dev`) and inspecting `http://localhost:3000/lineup` page source

**Checkpoint**: User Story 2 complete. The page is live at its URL but invisible in nav, sitemap, and search engines.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Responsive layout, visual consistency, and build validation.

- [x] T011 Apply responsive Tailwind layout to `frontend/pages/secret-lineup.tsx` — wrap content in a `section-container` div (or equivalent max-width class matching other pages), add `pt-28 md:pt-[3.5rem]` to `<main>` for header clearance, ensure lineup image uses `w-full max-w-4xl mx-auto` or similar for mobile + desktop
- [x] T012 [P] Run `cd frontend && npm run lint` — confirm no lint errors in `frontend/pages/secret-lineup.tsx`
- [x] T013 [P] Run `cd frontend && npx tsc --noEmit` — confirm no TypeScript errors
- [x] T014 Run `cd frontend && npm run build` — confirm static export generates `out/secret-lineup/index.html` (or `out/lineup.html`) without errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: N/A — skipped
- **Phase 3 (US1)**: Depends on Phase 1 — tasks T002→T007 are sequential (same file, build on each other)
- **Phase 4 (US2)**: T008 and T009 can run in parallel with each other; T010 depends on T002 being complete
- **Phase 5 (Polish)**: Depends on Phase 3 + Phase 4 complete; T012 and T013 can run in parallel

### User Story Dependencies

- **User Story 1 (P1)**: Can start immediately after Phase 1 — no story dependencies
- **User Story 2 (P2)**: T008 + T009 can start any time (audit only); T010 depends on T002
- **User Story 3 (P3)**: Fully delivered within Phase 3 (US1 tasks)

### Within Phase 3

Tasks T002 → T003 → T004 → T005 → T006 → T007 are sequential — each builds on the previous in the same file.

---

## Parallel Opportunities

```bash
# Phase 4 — US2 audits can run simultaneously:
T008: Audit Header.tsx for /lineup links
T009: Audit sitemap.xml for /lineup entries

# Phase 5 — Quality checks can run simultaneously:
T012: npm run lint
T013: npx tsc --noEmit
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 3: US1 implementation (T002–T007)
3. **STOP and VALIDATE**: Open `http://localhost:3000/lineup` — all content visible, AHS link works, lineup image renders
4. Deploy when ready

### Full Delivery (All Stories)

1. Phase 1 → Phase 3 (US1 + US3) → Phase 4 (US2) → Phase 5 (Polish)
2. Each phase is independently verifiable before moving on
3. Total: 14 tasks, single developer, estimated half-day

---

## Notes

- All tasks touch `frontend/pages/secret-lineup.tsx` in Phase 3 — sequential execution required
- Phase 4 audit tasks (T008, T009) require no code changes — they are verification steps
- The `section-container` class (T011) — check other page files to confirm the exact Tailwind class used for max-width content containers before applying
- Filenames with spaces (`Final Lineup.png`, `Sponsor Logos 2026/2.png`) work as `src` attribute values without modification — the browser handles URL encoding transparently
