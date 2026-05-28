# Tasks: Rebrand Site Colors and Fonts

**Input**: Design documents from `/specs/001-rebrand-colors-fonts/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅  
**Branch**: `001-rebrand-colors-fonts`

**Tests**: Per Principle X, this feature is **exempt** — it is entirely presentational with no logic, state, API calls, or conditional rendering. No test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. All changes are confined to 4 source files + font assets.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared state)
- **[Story]**: Which user story this task belongs to
- Exact file paths included in every task

---

## Phase 1: Setup — Font File Assets

**Purpose**: Copy new brand fonts into the project and remove legacy fonts. This is a prerequisite for all user stories — fonts must exist on disk before they can be referenced in CSS.

- [x] T001 Create `frontend/public/fonts/Anton/` directory and copy `Anton-Regular.ttf` from `/Users/huntersmith/Downloads/Final Brand Elements/Fonts/Anton - Logo Font/Anton-Regular.ttf`
- [x] T002 [P] Create `frontend/public/fonts/BricolageGrotesque/` directory and copy `BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf` from `/Users/huntersmith/Downloads/Final Brand Elements/Fonts/Bricolage Grotesque - Headline Font/`
- [x] T003 [P] Create `frontend/public/fonts/AvenirNext/` directory and copy `Avenir Next.ttc` from `/Users/huntersmith/Downloads/Final Brand Elements/Fonts/Avenir Next - Body Copy Font/`
- [x] T004 Delete `frontend/public/fonts/Aharoni Font/` directory and all its contents
- [x] T005 [P] Delete `frontend/public/fonts/Horizon Font/` directory and all its contents

**Checkpoint**: `/public/fonts/` should contain exactly three directories: `Anton/`, `BricolageGrotesque/`, `AvenirNext/`. The old `Aharoni Font/` and `Horizon Font/` directories should be gone.

---

## Phase 2: Foundational — Color Token System

**Purpose**: Establish the new brand color palette as the source of truth in the design system. This must complete before any user story work — US1, US2, and US3 all depend on the correct color tokens being in place.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 [P] Update `frontend/tailwind.config.js` — replace all legacy hex values in the `brand` color object. Apply: `primary: '#FCBC3A'`, `'primary-dark': '#C99620'`, `pink: '#EA4E9A'`, `accent: '#40BCB7'`, `peach: '#FEEAD6'`, `bg: '#FAF5F0'`, `'bg-cream': '#FAF5F0'`, `'bg-sand': '#FEEAD6'`, `'bg-taupe': '#F0E8DC'`. Add new token `green: '#3AAA45'`. Update neutral shades to warm values. Do NOT change `header`, `text`, `text-light`, or `bg-dark` tokens.
- [x] T007 [P] Update `[data-theme="connect"]` block in `frontend/styles/globals.css` — change: `--color-primary` to `#FCBC3A`, `--color-secondary` to `#C99620`, `--color-accent` to `#40BCB7`, `--color-warning` to `#C99620`, `--color-base-200` to `#FAF5F0`, `--color-base-300` to `#FEEAD6`. Leave all other DaisyUI vars unchanged.

**Checkpoint**: Brand colors are now updated in both the Tailwind token system and the DaisyUI theme. Any Tailwind class using `brand-primary`, `brand-pink`, `brand-accent`, or `brand-bg*` will produce the new palette values after the next build.

---

## Phase 3: User Story 1 — Site Visitor Experiences Updated Brand Identity (Priority: P1) 🎯 MVP

**Goal**: New brand fonts are self-hosted, load correctly, and replace all legacy CDN-loaded fonts. The visitor sees the new color palette applied through the token changes from Phase 2.

**Independent Test**: Open the site. Open browser DevTools → Network tab → filter by "Font". Confirm requests go to `/fonts/Anton/`, `/fonts/BricolageGrotesque/`, `/fonts/AvenirNext/` — and that there are **zero** requests to `fonts.googleapis.com` or `use.typekit.net`. Visually confirm the page no longer uses the old gold (#F7C03E) or neon pink (#F81889) colors.

- [x] T008 [US1] Replace the two `@font-face` blocks in `frontend/styles/globals.css` (Aharoni Bold and Horizon) with three new `@font-face` declarations:
  - `Anton`: `src: url('/fonts/Anton/Anton-Regular.ttf') format('truetype')`, `font-weight: 400`, `font-display: swap`
  - `Bricolage Grotesque`: `src: url('/fonts/BricolageGrotesque/BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf') format('truetype')`, `font-weight: 100 900`, `font-display: swap`
  - `Avenir Next`: `src: url('/fonts/AvenirNext/Avenir Next.ttc') format('truetype')`, `font-weight: 100 900`, `font-display: swap`
- [x] T009 [US1] In `frontend/pages/_document.tsx` — remove the 4 Google Fonts `<link>` tags (`preconnect` to fonts.googleapis.com, `preconnect` to fonts.gstatic.com, and the stylesheet link) AND remove the 2 Adobe Fonts `<link>` tags (`preconnect` to use.typekit.net and the stylesheet link). Leave all other `<Head>` content intact.
- [x] T010 [US1] In `frontend/styles/globals.css` `@layer base` — add or update the `body` rule to explicitly apply `font-family: 'Avenir Next', Avenir, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` so that body text defaults to the new brand body font instead of whatever the browser default is.

**Checkpoint**: Run `npm run build` in `frontend/`. Open the dev server. Confirm in DevTools Network tab that no requests go to Google Fonts or Adobe Fonts. Confirm body copy looks visually different from the legacy font (no more Montserrat).

---

## Phase 4: User Story 2 — Typography Hierarchy Is Clear and Consistent (Priority: P2)

**Goal**: The three-font role system is correctly wired up through Tailwind tokens: `font-horizon` and `font-festival` → Anton; `font-title` → Bricolage Grotesque; `font-logo` → Anton. All page titles, section headings, and body copy render in the correct brand typeface.

**Independent Test**: Inspect any page in DevTools → Elements tab. Select a hero page title (uses `font-horizon` or `font-festival` class) → confirm computed font-family is Anton. Select a section heading (uses `font-title`) → confirm Bricolage Grotesque. Select body paragraph → confirm Avenir Next.

- [x] T011 [US2] Update `frontend/tailwind.config.js` `fontFamily` section — remap all four active font tokens to new stacks, and remove `font-slogan`:
  - `'festival': ['"Anton"', 'Impact', 'Arial Black', 'sans-serif']`
  - `'title': ['"Bricolage Grotesque"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']`
  - `'logo': ['"Anton"', 'Impact', 'Arial Black', 'sans-serif']`
  - `'horizon': ['"Anton"', 'Impact', 'Arial Black', 'sans-serif']`
  - Delete the `'slogan'` entry entirely (0 active usages)
- [x] T012 [P] [US2] Update `@layer base` in `frontend/styles/globals.css` — change the `h1, h2, h3, h4, h5, h6` rule from `@apply text-brand-pink font-bold` to `@apply text-brand-pink font-bold font-title` so all headings explicitly inherit the Bricolage Grotesque stack defined by `font-title`.
- [x] T013 [P] [US2] Update `frontend/pages/_document.tsx` — change the `<meta name="theme-color" content="#D99B2A" />` value to `#FCBC3A` (Sunkiss Yellow) to match the new primary brand color in mobile browser chrome.

**Checkpoint**: Inspect the computed `font-family` on page titles, section headings, and body paragraphs across at least the home page and one other page. All three font roles should resolve correctly. No "Montserrat", "Bebas Neue", "Horizon", or "Aharoni" should appear anywhere in computed styles.

---

## Phase 5: User Story 3 — Interactive Elements Reflect New Brand Colors (Priority: P3)

**Goal**: All hardcoded legacy hex colors in `globals.css` utility classes, glow effects, gradient utilities, and animation keyframes are replaced with new brand palette values. Buttons, hover states, and gradient text effects all reflect the official palette.

**Independent Test**: Hover over primary CTA buttons on the home page — confirm hover color is Sunkiss Yellow dark (#C99620) not the old dark gold. Inspect any gradient text element in DevTools → confirm gradient stops use new brand hex values with no legacy colors (#F81889, #8C52FF, #18B4DD, #FEB95F).

- [x] T014 [US3] Update glow utilities in `@layer utilities` in `frontend/styles/globals.css`:
  - `.glow-pink`: change `rgba(248, 24, 137, 0.5)` → `rgba(234, 78, 154, 0.5)` (Pulse Pink)
  - `.glow-purple`: **delete this utility entirely** (no purple in new palette)
  - `.glow-gold`: change `rgba(217, 155, 42, 0.6)` → `rgba(252, 188, 58, 0.6)` (Sunkiss Yellow)
  - Also update the `@keyframes pulse-glow` stops from `rgba(140, 82, 255)` → `rgba(64, 188, 183)` (Open Sky Aqua) and `@keyframes pulse-glow-gold` from `rgba(217, 155, 42)` → `rgba(252, 188, 58)` (Sunkiss Yellow)
- [x] T015 [US3] Update gradient text utilities in `@layer utilities` in `frontend/styles/globals.css`:
  - `.gradient-text`: update `@apply` stops — `from-brand-primary via-brand-pink to-brand-accent` (these will auto-update via token, verify the apply chain is correct)
  - `.gradient-text-pink`: change `#F81889` → `#EA4E9A` (Pulse Pink) and `#FF5722` → `#FCBC3A` (Sunkiss Yellow)
  - `.gradient-bg`: update `@apply` stops — `from-brand-header via-brand-primary to-brand-pink` (verify apply chain)
- [x] T016 [US3] Update title and hero gradient utilities in `@layer utilities` in `frontend/styles/globals.css`:
  - `.hero-gradient-gold`: change `#FFFDF3` → `#FAF5F0` (Off White) and `#FFD983` → `#FCBC3A` (Sunkiss Yellow)
  - `.title-beats`: change `#FEB95F` → `#FCBC3A`, `#F81889` → `#EA4E9A`, `#8C52FF` → `#40BCB7`
  - `.title-beltline` renamed to `.title-block`: `#F81889` → `#EA4E9A`, `#8C52FF` → `#40BCB7`, `#5CE1E6` → `#3AAA45`
  - `.title-on-the`: verified — white text only, no legacy hex values

**Checkpoint**: In DevTools, inspect `.gradient-text` applied elements and `.btn-festival` buttons — confirm no legacy hex values appear in computed styles. Check the Network tab to confirm no 404s on font files. Run a quick visual pass on all 5 pages.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Design system page sync, build verification, and accessibility confirmation.

- [x] T017 [P] Update `frontend/pages/design-system.tsx` — replace all hardcoded legacy color hex display values (e.g., `#8C52FF`, `#5CE1E6`, `#F81889`, `#FEB95F`) shown in the color swatch grid with the new brand hex values (`#EA4E9A`, `#40BCB7`, `#FCBC3A`, `#3AAA45`, `#FEEAD6`, `#FAF5F0`) and update swatch names to match new brand naming (Pulse Pink, Open Sky Aqua, Sunkiss Yellow, Valley Green, Relaxed Tan, Off White)
- [x] T018 [P] Run `npm run build` in `frontend/` — resolve any TypeScript errors, PostCSS/Tailwind warnings, or missing font file 404s that surface during the static export build
- [x] T019 WCAG AA contrast verified. Results: body text on Off White 16.07:1 ✅; Pulse Pink headings on Off White 3.20:1 ✅ (large text threshold 3:1); dark text on Sunkiss Yellow 10.27:1 ✅; dark text on Relaxed Tan 14.88:1 ✅. `.btn-festival` and `--color-primary-content` use dark text (#1A1A1A) on Sunkiss Yellow — 10.27:1 ✅. White text on yellow (1.69:1) was tested and rejected per /speckit.analyze finding C1.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately. T001–T003 fully parallel; T004–T005 parallel with each other.
- **Foundational (Phase 2)**: Depends on Setup completion (font files must exist). T006 and T007 are parallel (different files).
- **User Stories (Phase 3–5)**: All depend on Foundational completion. Stories are sequential by priority.
- **Polish (Phase 6)**: Depends on all user story phases completing. T017 and T018 are parallel.

### User Story Dependencies

- **US1 (Phase 3)**: Requires Setup + Foundational complete. No dependency on US2 or US3.
- **US2 (Phase 4)**: Requires US1 complete (font @font-face must exist before token remapping is meaningful). T012 and T013 are parallel within this phase.
- **US3 (Phase 5)**: Requires Foundational complete (color tokens must be set before gradient utility audit is meaningful). Can start independently of US2 in theory, but sequential after US2 avoids conflicting globals.css edits.

### Within Each Phase

- Phase 1: T001 → T002/T003 (parallel) → T004/T005 (parallel)
- Phase 2: T006 and T007 in parallel
- Phase 3: T008 → T009 → T010 (sequential, all touch different concerns but T009 depends on T008 being in place conceptually)
- Phase 4: T011 → T012/T013 (T012 and T013 parallel — different files)
- Phase 5: T014 → T015 → T016 (sequential — all globals.css utilities layer)
- Phase 6: T017/T018 parallel → T019

---

## Parallel Execution Examples

### Phase 1 (Font Files)
```
Parallel: T001, T002, T003  (copy each font to its own new directory)
Then sequential: T004, T005  (delete old directories — parallel safe)
```

### Phase 2 (Color Tokens)
```
Parallel: T006 (tailwind.config.js), T007 (globals.css DaisyUI block)
```

### Phase 4 (Typography Hierarchy)
```
Sequential: T011 (tailwind.config.js fontFamily)
Then parallel: T012 (globals.css base layer), T013 (_document.tsx meta tag)
```

### Phase 6 (Polish)
```
Parallel: T017 (design-system.tsx), T018 (npm run build)
Then: T019 (contrast audit — after build confirms no errors)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1**: Copy font files, delete old ones
2. Complete **Phase 2**: Update color tokens in tailwind.config.js + DaisyUI theme
3. Complete **Phase 3**: Add @font-face, remove CDN links, set body font
4. **STOP and VALIDATE**: Open dev server. Confirm fonts load from local path. Confirm new color palette renders. No CDN requests.
5. Deploy to dev for visual review — this is already a shippable brand refresh.

### Incremental Delivery

1. **Phase 1 + 2 + 3** → Font assets in place, colors updated, new fonts loading → MVP visual refresh ✅
2. **+ Phase 4** → Typography hierarchy correctly mapped across all font roles → Typography complete ✅
3. **+ Phase 5** → Interactive elements, gradients, glow effects updated → Full brand implementation ✅
4. **+ Phase 6** → Design system page synced, build verified, accessibility confirmed → Ship-ready ✅

---

## Notes

- [P] tasks touch different files — safe to run in parallel
- All tasks are in `frontend/` — no Lambda, CDK, or shared-types changes
- Font files from brand kit path: `/Users/huntersmith/Downloads/Final Brand Elements/Fonts/`
- No component files require edits — only config, styles, document head, and font assets
- 19 total tasks across 6 phases
- Estimated blast radius: 4 source files + 5 font asset directories
