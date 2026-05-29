# Implementation Plan: Sponsor Updates & AHS Presented-By Hero Placement

**Branch**: `007-sponsor-updates` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/007-sponsor-updates/spec.md`

## Summary

Replace the old sponsor logos in the home page Sponsors section with the 2026 set of PNG images from `public/images/Sponsor Logos 2026/` (images 3–15). Add the AHS "Presented by" logo (`2.png`) prominently in the hero section below the Beats on the Block logo, visible on all screen sizes.

This is a pure frontend static change — two component edits, no Lambda, no DynamoDB, no CDK.

## Technical Context

**Language/Version**: TypeScript 5.x / TSX (Next.js static export)  
**Primary Dependencies**: Next.js, React, Tailwind CSS  
**Storage**: N/A — logo PNGs already committed to `public/images/Sponsor Logos 2026/`  
**Testing**: Jest + React Testing Library (`frontend/`)  
**Target Platform**: Web (static export → S3 + CloudFront)  
**Project Type**: Web application (frontend UI only)  
**Performance Goals**: No regression — static assets already on CloudFront, no new runtime work  
**Constraints**: Next.js static export (no SSR); Tailwind only (no inline styles, no CSS modules)  
**Scale/Scope**: 2 component files modified (`HeroSection.tsx`, `SponsorsSection.tsx`)

## Constitution Check

*GATE: Must pass before implementation.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Stack Fidelity | ✅ Pass | Pure frontend change; no new runtimes or services |
| II. Simplicity First | ✅ Pass | Minimal: swap image data and add one `<img>` element; removes unneeded sizing logic |
| III. Environment Discipline | ✅ Pass | Normal PR → dev → staging → prod flow |
| IV. DynamoDB Is Source of Truth | ✅ Pass | N/A — no application data involved |
| V. Security Boundaries | ✅ Pass | N/A — no auth or secret changes |
| VI. Lambda Handler Pattern | ✅ Pass | N/A — no Lambda changes |
| VII. Frontend Static Export | ✅ Pass | Static images; no SSR, no API routes added |
| VIII. CDK Infrastructure as Code | ✅ Pass | N/A — no AWS resource changes |
| IX. Code Quality | ✅ Pass | TypeScript strict maintained; no `any`; no inline styles |
| X. Testing Standards | ✅ Pass | Both modified components become or remain purely presentational (no state, no API calls, no conditional rendering logic); exempt per constitution |
| XI. UX Consistency | ✅ Pass | Tailwind only; responsive grid preserved; loading/error states N/A for static images |
| XII. Performance Requirements | ✅ Pass | Static PNG assets served from same CloudFront distribution; no new origins |

**No violations. No Complexity Tracking entries required.**

## Project Structure

### Documentation (this feature)

```text
specs/007-sponsor-updates/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

*Note: `data-model.md` and `contracts/` are omitted — no data model or API contract changes.*

### Source Code (files touched)

```text
frontend/
├── components/
│   └── home/
│       ├── HeroSection.tsx        # Add AHS "Presented By" logo below BOTB logo
│       └── SponsorsSection.tsx    # Replace SPONSORS array with 2026 PNG logos
└── public/
    └── images/
        └── Sponsor Logos 2026/    # Already committed — 2.png through 15.png
            ├── 2.png              # AHS "Presented By" logo (hero placement)
            ├── 3.png … 15.png     # 2026 sponsor grid logos
```

## Phase 0: Research

See [research.md](./research.md) for full findings. Key decisions:

1. AHS logo is shown on all screen sizes via a dedicated block outside the desktop-only BOTB logo wrapper.
2. 2026 sponsor logos use uniform Tailwind sizing (removes old name-based conditional sizing).
3. Sponsor alt text uses `Sponsor [N]` fallback pattern; user should supply names to complete accessibility.

## Phase 1: Design

### HeroSection.tsx — AHS Placement

**Current structure (simplified):**
```
<section hero>
  <div hidden md:block>          ← BOTB logo, desktop only
    <img BOTB_White.png />
  </div>
  {renderContent()}              ← events / hero cards / empty state
</section>
```

**Target structure:**
```
<section hero>
  <div hidden md:block>          ← BOTB logo, desktop only (unchanged)
    <img BOTB_White.png />
  </div>
  <div text-center mb-8>         ← AHS logo, ALL screen sizes (new)
    <img Sponsor Logos 2026/2.png  alt="Presented by Advanced Health Solutions" />
  </div>
  {renderContent()}
</section>
```

- On desktop: BOTB logo → AHS logo → event/card content.
- On mobile: AHS logo → event/card content (BOTB logo remains hidden as today).
- AHS logo sizing: `max-w-xs md:max-w-sm lg:max-w-md mx-auto` — readable at all sizes, not dominant over the BOTB logo on desktop.

### SponsorsSection.tsx — 2026 Logo Grid

**Current:** `SPONSORS` array of 9 objects `{ name, logo }` with name-based height/width overrides.

**Target:** Array of 13 entries (images 3–15), uniform sizing, no conditional class logic.

```tsx
const SPONSORS_2026 = [
  { name: 'Sponsor 3',  logo: '/images/Sponsor Logos 2026/3.png'  },
  // … through 15
]
```

- Grid layout retained: `grid-cols-3 md:grid-cols-4 lg:grid-cols-6`
- Height class: uniform `max-h-[50px]` and `max-w-[60px]` (same as current default)
- Remove `SMALLER_HEIGHT` and `LARGER_HEIGHT` sets (no longer needed; names will be updated later)
- User should provide sponsor names to replace `Sponsor N` placeholders for proper accessibility

### Testing Scope

Both changes produce purely presentational components:

- `HeroSection.tsx`: New `<img>` element with no logic — no state, no conditional rendering beyond existing `renderContent()`. Adding the AHS logo does not introduce testable logic. **Exempt per Principle X.**
- `SponsorsSection.tsx`: After removing the `SMALLER_HEIGHT`/`LARGER_HEIGHT` conditional logic, the component becomes a pure data-render loop. **Exempt per Principle X.**

**However**: if sponsor names are added and variable sizing is restored (per user input), a unit test covering class selection logic MUST be added at that point.
