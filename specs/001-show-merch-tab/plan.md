# Implementation Plan: Restore Merch Tab with Bonfire Store

**Branch**: `001-show-merch-tab` | **Date**: 2026-04-22 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-show-merch-tab/spec.md`

## Summary

Restore the hidden "Merch" navigation tab and update the `/merch` page to display current Bonfire store products. The nav link is added back to `Header.tsx` (desktop + mobile). `MerchGrid.tsx` is updated with a new hardcoded product array using Bonfire-hosted image URLs and per-product Bonfire page links, plus a "Shop All" CTA below the grid. `next.config.js` gains the Bonfire CDN hostname in `remotePatterns`. No Lambda, DynamoDB, or CDK changes are required.

## Technical Context

**Language/Version**: TypeScript 5.x / TSX  
**Primary Dependencies**: Next.js (static export), React, Tailwind CSS  
**Storage**: N/A — no data model changes  
**Testing**: Jest + React Testing Library (`frontend/`)  
**Target Platform**: Static export → S3 + CloudFront  
**Project Type**: Web application (Next.js frontend only)  
**Performance Goals**: Static page, zero runtime API calls — Bonfire images served from Bonfire CDN  
**Constraints**: Next.js static export (`output: 'export'`); `unoptimized: true` already set; Bonfire image CDN hostname must be added to `remotePatterns`  
**Scale/Scope**: 3 source files changed, 2 test files updated, 1 snapshot deleted

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Stack Fidelity | ✅ Pass | Frontend-only change; no new runtimes or services |
| II. Simplicity First | ✅ Pass | Minimal change — no abstractions, no new patterns |
| III. Environment Discipline | ✅ Pass | Goes through dev → staging → prod via PR |
| IV. DynamoDB Is Source of Truth | ✅ Pass | N/A — no application data involved |
| V. Security Boundaries | ✅ Pass | N/A — public page, no auth |
| VI. Lambda Handler Pattern | ✅ Pass | N/A — no Lambda changes |
| VII. Frontend Static Export | ✅ Pass | No SSR, no API routes, no server-side data fetching |
| VIII. CDK Infrastructure as Code | ✅ Pass | N/A — no infrastructure changes |
| IX. Code Quality | ✅ Pass | TypeScript strict; Tailwind only; no inline styles |
| X. Testing Standards | ✅ Pass | Header and MerchGrid tests updated; snapshot deleted |
| XI. UX Consistency | ✅ Pass | Existing card layout and Tailwind patterns reused |
| XII. Performance Requirements | ✅ Pass | Static page; images from external CDN; no optimization regression |

## Project Structure

### Documentation (this feature)

```text
specs/001-show-merch-tab/
├── plan.md              ← this file
├── research.md          ← Phase 0 complete
├── spec.md
├── checklists/
│   └── requirements.md
└── tasks.md             ← created by /speckit.tasks
```

### Source Code (files touched)

```text
frontend/
├── components/
│   ├── layout/
│   │   ├── Header.tsx                          ← add Merch nav link
│   │   └── Header.test.tsx                     ← add Merch assertion
│   └── merch/
│       ├── MerchGrid.tsx                       ← replace MERCH_ITEMS with Bonfire data
│       ├── MerchGrid.test.tsx                  ← update product name + URL assertions
│       └── __snapshots__/
│           └── MerchGrid.test.tsx.snap         ← DELETE (regenerates on next test run)
├── next.config.js                              ← add Bonfire CDN domain to remotePatterns
└── public/
    └── images/
        └── merch/                              ← DELETE all files (no longer referenced)
```

**Structure Decision**: Web application, Option 2 (frontend only). No backend, infrastructure, or shared types changes required.

## Phase 0: Research

**Status**: Complete — see [research.md](./research.md)

Key findings:
- Bonfire CDN hostname must be verified by inspecting a real product image URL before adding to `remotePatterns`. **Developer action required before starting implementation.**
- Product data (names, prices, image URLs, product page URLs) must be collected from `https://www.bonfire.com/store/beats-on-the-block/` before updating `MerchGrid.tsx`.
- Hardcoded static array is the correct approach — no API, no DynamoDB.
- Existing `MerchGrid.tsx` snapshot must be deleted; it will regenerate on first passing test run.

## Phase 1: Design

### Data Model

No new data model. The product array in `MerchGrid.tsx` retains the existing shape:

```typescript
type MerchItem = {
  name: string    // e.g. "Beats on the Beltline 2026 White Tee"
  price: string   // e.g. "$35.00"
  image: string   // Bonfire CDN URL (https://cdn.bonfire.com/... — verify hostname)
  url: string     // Bonfire individual product page URL
}
```

### Interface Contracts

No new API contracts. No Lambda changes. All changes are purely within the static frontend.

### Implementation Details

#### 1. `frontend/components/layout/Header.tsx`

Add one `<Link>` entry between "Join Us" and "Contact" in both the desktop nav block (`hidden md:flex`) and the mobile menu dropdown:

```tsx
<Link href="/merch" className="text-gray-800 hover:text-brand-primary transition-colors font-medium">
  Merch
</Link>
```

Mobile variant (same `href`, includes `onClick={closeMobileMenu}` and block/hover classes to match existing mobile links).

#### 2. `frontend/components/merch/MerchGrid.tsx`

Replace the `MERCH_ITEMS` array with current Bonfire products. Each item's `image` field becomes a Bonfire CDN URL instead of a local `/images/merch/...` path. The `url` field becomes the individual Bonfire product page URL.

Update the "Shop All" section below the grid (the existing "Get Your Merch" block) to include an explicit `<a>` link to `https://www.bonfire.com/store/beats-on-the-block/` with `target="_blank" rel="noopener noreferrer"`.

Remove the `fill` prop from `<Image>` if switching from local to external URLs causes layout issues — verify during implementation.

#### 3. `frontend/next.config.js`

Add the Bonfire image CDN hostname to `remotePatterns`. Inspect a Bonfire product image URL first to confirm the hostname:

```js
{
  protocol: 'https',
  hostname: '<bonfire-cdn-hostname>',  // verify: e.g. 'cdn.bonfire.com'
  pathname: '/**',
},
```

#### 4. `frontend/components/layout/Header.test.tsx`

In the `'renders all navigation links'` test, add:

```ts
expect(screen.getByText('Merch')).toBeInTheDocument()
```

#### 5. `frontend/components/merch/MerchGrid.test.tsx`

- Replace the "renders all five merch items" test with assertions matching the new Bonfire product names.
- Replace the URL check (`fourthwall.com`) with `bonfire.com`.
- Delete `frontend/components/merch/__snapshots__/MerchGrid.test.tsx.snap` so the snapshot regenerates cleanly.

#### 6. Cleanup: `frontend/public/images/merch/`

Delete all files in this directory — `whitetshirt.jpg`, `retrotee.jpg`, `discotee.jpg`, `circle sticker.png`, `blocksticker.png` — as they are no longer referenced by any component.
