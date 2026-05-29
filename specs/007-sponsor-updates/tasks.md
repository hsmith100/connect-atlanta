# Tasks: Sponsor Updates & AHS Presented-By Hero Placement

**Input**: Design documents from `/specs/007-sponsor-updates/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: Both modified components become purely presentational after this change (no state, no API calls, no conditional logic). Per Principle X of the constitution, purely presentational components are **exempt** from the unit test mandate. No test tasks generated. If variable sizing logic is added later, tests must be added at that time.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 or US2)
- Exact file paths included in every description

---

## Phase 1: Setup (Verify Assets)

**Purpose**: Confirm the 2026 sponsor PNG assets are in place before editing components

- [x] T001 Verify all required PNG assets exist: `frontend/public/images/Sponsor Logos 2026/2.png` through `15.png` (13 sponsor files + 1 AHS logo)

**Checkpoint**: All 14 PNG files confirmed present — implementation can begin

---

## Phase 2: User Story 1 — AHS "Presented By" Hero Placement (Priority: P1) 🎯 MVP

**Goal**: Add the AHS "Presented by Advanced Health Solutions" logo to the hero section of the home page, centered and visible on all screen sizes, directly below the Beats on the Block logo.

**Independent Test**: Load http://localhost:3000 on desktop and mobile viewport. The AHS logo (`2.png`) must appear centered in the hero, below the BOTB logo on desktop and as the topmost hero element on mobile, before any scrolling.

### Implementation for User Story 1

- [x] T002 [US1] In `frontend/components/home/HeroSection.tsx`, add a centered AHS logo `<img>` block between the `hidden md:block` BOTB logo div and the `{renderContent()}` call. Use `src="/images/Sponsor Logos 2026/2.png"`, `alt="Presented by Advanced Health Solutions"`, and Tailwind classes `block mx-auto max-w-[200px] md:max-w-xs lg:max-w-sm` with appropriate vertical margin (`mb-6 md:mb-8`). No wrapper div needed beyond text-center.

**Checkpoint**: AHS logo is visible on both desktop and mobile in the hero section — User Story 1 complete and independently testable

---

## Phase 3: User Story 2 — Updated 2026 Sponsor Grid (Priority: P2)

**Goal**: Replace all old SVG sponsor logos in the home page Sponsors section with the 13 2026 PNG logos (images 3–15 from `Sponsor Logos 2026/`).

**Independent Test**: Scroll to the Sponsors section on http://localhost:3000. Only PNG logos from `Sponsor Logos 2026/` should be visible. No old SVG logos (coke-zero, deep-eddy, lunazul, etc.) should appear. Grid is responsive at 3/4/6 columns across breakpoints.

### Implementation for User Story 2

- [x] T003 [US2] In `frontend/components/home/SponsorsSection.tsx`, remove the `SPONSORS` array, `SMALLER_HEIGHT` set, and `LARGER_HEIGHT` set. Add a `SPONSORS_2026` array with 13 entries for images 3–15: `{ name: 'Sponsor 3', logo: '/images/Sponsor Logos 2026/3.png' }` through `{ name: 'Sponsor 15', logo: '/images/Sponsor Logos 2026/15.png' }`. Update the grid JSX to map over `SPONSORS_2026` using uniform Tailwind sizing (`max-h-[50px] max-w-[60px]`) for all logos — remove the conditional `heightClass`/`widthClass` logic entirely.

**Checkpoint**: Sponsors section shows all 13 new logos with no old logos remaining — User Story 2 complete and independently testable

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Visual QA, lint/typecheck gate, and quickstart validation

- [x] T004 [P] Run `cd frontend && npm run lint` and fix any lint errors introduced by T002 or T003
- [x] T005 [P] Run `cd frontend && npx tsc --noEmit` and fix any TypeScript errors
- [x] T006 Run `cd frontend && npm run dev`, then walk through every item in `specs/007-sponsor-updates/quickstart.md` — confirm all checklist items pass at both mobile (375px) and desktop (1440px) viewport widths
- [ ] T007 (Optional) Update `name` values in the `SPONSORS_2026` array in `frontend/components/home/SponsorsSection.tsx` once real 2026 sponsor names are confirmed by the user (improves accessibility alt text from `Sponsor N` to actual names)

**Checkpoint**: Lint, typecheck, and visual QA all pass — feature ready for PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run immediately
- **US1 (Phase 2)**: Depends on Phase 1 asset verification — single task, fast
- **US2 (Phase 3)**: Depends on Phase 1 asset verification — independent from US1 (different file)
- **Polish (Phase 4)**: Depends on both US1 and US2 being complete

### User Story Dependencies

- **User Story 1 (P1)**: Touches `HeroSection.tsx` only — no dependency on US2
- **User Story 2 (P2)**: Touches `SponsorsSection.tsx` only — no dependency on US1
- Both stories can be worked in **parallel** after Phase 1

### Parallel Opportunities

- T002 (US1) and T003 (US2) touch different files and can be executed in parallel
- T004 (lint) and T005 (typecheck) can run in parallel after T002 and T003

---

## Parallel Example: US1 + US2 Together

```bash
# After T001 (asset verification), both stories can proceed simultaneously:
Task A: T002 — Edit HeroSection.tsx (US1)
Task B: T003 — Edit SponsorsSection.tsx (US2)

# After both complete, run polish in parallel:
Task C: T004 — npm run lint
Task D: T005 — npx tsc --noEmit
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Verify assets (T001)
2. Complete Phase 2: Add AHS hero logo (T002)
3. **STOP and VALIDATE**: Confirm AHS logo visible in hero on desktop + mobile
4. Ship US1 alone if needed — zero risk to Sponsors section

### Full Delivery (Both Stories)

1. T001 — Verify assets
2. T002 + T003 — Implement US1 and US2 in parallel (different files)
3. T004 + T005 — Lint and typecheck in parallel
4. T006 — Visual QA walkthrough
5. T007 — (Optional) Fill in real sponsor names
6. Open PR

---

## Notes

- T002 and T003 are independent — different files, zero cross-story risk
- `Sponsor Logos 2026/` path contains a space — ensure image `src` paths use URL-encoded paths or confirm Next.js serves them correctly (test during T006)
- T007 (sponsor names) is a one-line-per-entry data update — low risk, can be done anytime before or after PR merge
