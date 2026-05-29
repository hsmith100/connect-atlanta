# Implementation Plan: Secret Lineup Reveal Page

**Branch**: `006-secret-lineup` | **Date**: 2026-05-29 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/006-secret-lineup/spec.md`

## Summary

Add a new static page at `/secret-lineup` that displays the AHS sponsor section (Logo 2, blurb, link) followed by the final performer lineup image. The page is publicly accessible via direct URL but excluded from navigation menus, the sitemap, and search engine indexing. No backend, database, or infrastructure changes are required — this is a pure frontend addition.

## Technical Context

**Language/Version**: TypeScript 5.x / TSX (Next.js)  
**Primary Dependencies**: Next.js (static export), React, Tailwind CSS — all existing  
**Storage**: N/A — entirely static content  
**Testing**: Exempt per Constitution Principle X (purely presentational page with no logic, state, or API calls)  
**Target Platform**: Static export → S3 + CloudFront (existing pipeline)  
**Project Type**: Web application (frontend only for this feature)  
**Performance Goals**: Standard CloudFront static page performance — no special targets  
**Constraints**: Static export only — no SSR, no `getServerSideProps`, no API routes  
**Scale/Scope**: Single page file + two image assets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Stack Fidelity | ✅ Pass | Pure Next.js frontend page. No new runtimes, services, or frameworks. |
| II. Simplicity First | ✅ Pass | Single page file, no abstractions, no configuration. |
| III. Environment Discipline | ✅ Pass | Page is env-agnostic static content. CI/CD handles dev/staging/prod. |
| IV. DynamoDB Is Source of Truth | N/A | No application data. |
| V. Security Boundaries | ✅ Pass | Page is intentionally public. No auth. No secrets. |
| VI. Lambda Handler Pattern | N/A | No Lambda changes. |
| VII. Frontend Static Export | ✅ Pass | Standard `frontend/pages/*.tsx` pattern. |
| VIII. CDK Infrastructure as Code | ✅ Pass | No AWS resource changes. |
| IX. Code Quality | ✅ Pass | TypeScript strict, Tailwind only, no unused imports. |
| X. Testing Standards | ✅ Exempt | Purely presentational page, no logic — exempt per constitution. |
| XI. UX Consistency | ✅ Pass | Tailwind classes, mobile-first, uses existing layout pattern (SEO + Header + main + Footer). |
| XII. Performance Requirements | ✅ Pass | Static asset served from CloudFront. lineup.png bundled with build (not media bucket). |

**No violations. No Complexity Tracking entries required.**

## Project Structure

### Documentation (this feature)

```text
specs/006-secret-lineup/
├── plan.md           ← this file
├── research.md       ← Phase 0 output
├── data-model.md     ← Phase 1 output (N/A — documents static asset only)
├── quickstart.md     ← Phase 1 output
└── tasks.md          ← Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code Changes

```text
frontend/
├── pages/
│   └── lineup.tsx                              ← NEW: secret lineup page
└── public/
    └── images/
        ├── Sponsor Logos 2026/
        │   └── 2.png                           ← EXISTS: AHS "Presented By" logo
        └── Final Lineup.png                    ← EXISTS: performer lineup image
```

**No other files are modified.** Specifically:
- `Header.tsx` — not touched (no nav link added)
- `sitemap.xml` — not touched (no entry added)
- `robots.txt` — not touched (noindex handled via SEO component prop)
- All Lambda handlers — not touched
- All CDK stacks — not touched

## Implementation Detail

### `frontend/pages/secret-lineup.tsx`

The page follows the standard page pattern established across the codebase:

```
SEO (noindex=true, title="Secret Lineup | Beats on the Block")
Header
main
  ├── h1: "Secret Lineup"
  ├── img: Logo 2 (Presented by AHS)
  ├── AHS sponsor blurb (verbatim text, 3 paragraphs)
  ├── a[href="https://ahsdoctors.com", target="_blank", rel="noopener noreferrer"]: link text
  └── img: lineup.png (alt text describing the lineup)
Footer
```

- Tailwind classes for layout, spacing, typography — consistent with brand style
- Mobile-first responsive layout
- `rel="noopener noreferrer"` on external link (security best practice)
- Image `alt` attributes for accessibility
- No state, no `useEffect`, no API calls

### SEO Props

```tsx
<SEO
  title="Secret Lineup | Beats on the Block"
  description="The official Beats on the Block lineup, presented by Advanced Health Solutions."
  noindex={true}
/>
```

## User-Supplied Asset Prerequisites

Two files must be provided before this feature is complete:

| Asset | Confirmed Path | Status |
|-------|---------------|--------|
| Logo 2 (AHS) | `frontend/public/images/Sponsor Logos 2026/2.png` | ✅ Already in repo |
| Lineup image | `frontend/public/images/Final Lineup.png` | ✅ Already in repo |

Both assets are present and ready. No placeholder or swap needed.

## Phase 0 Artifacts

- [research.md](research.md) — All decisions resolved. No NEEDS CLARIFICATION items remain.

## Phase 1 Artifacts

- [data-model.md](data-model.md) — N/A, documents static asset paths only
- [quickstart.md](quickstart.md) — Local dev and verification steps
- No `contracts/` directory — no new API routes or external interfaces
