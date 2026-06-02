# Implementation Plan: Rebrand Site Colors and Fonts

**Branch**: `001-rebrand-colors-fonts` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-rebrand-colors-fonts/spec.md`

## Summary

Replace the legacy font stack (Montserrat, Bebas Neue, Horizon, Aharoni) and color palette with the official Beats on the Block brand identity. Fonts are self-hosted from the brand kit assets. Color tokens are updated in the Tailwind config and DaisyUI theme. Existing Tailwind font-family token names are preserved so no component files require changes — only the config, globals, document head, and font asset files change.

## Technical Context

**Language/Version**: TypeScript 5.x / TSX — Next.js 16.x (static export)  
**Primary Dependencies**: Tailwind CSS v4 (CSS-first config via `@config`), DaisyUI v5, Next.js static export  
**Storage**: N/A — no data model changes  
**Testing**: Jest + React Testing Library (frontend) — this feature is exempt per Principle X (purely presentational, no logic)  
**Target Platform**: Web, all modern browsers, mobile-first (320px minimum)  
**Project Type**: Web application — frontend styling only  
**Performance Goals**: No regression in page load; fonts render within first contentful paint window using `font-display: swap`  
**Constraints**: Tailwind utility classes only (no inline styles — Principle XI); static export compatibility; CloudFront-cached font assets  
**Scale/Scope**: All existing frontend pages (5 pages + shared components); ~40 affected class usages across ~20 files; 4 source files changed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Stack Fidelity | ✅ PASS | Frontend-only change; no new runtimes or AWS services |
| II. Simplicity First | ✅ PASS | Token remapping only; no new abstractions; existing class names preserved |
| III. Environment Discipline | ✅ PASS | Normal PR → dev → staging → prod flow |
| IV. DynamoDB Source of Truth | ✅ N/A | No data changes |
| V. Security Boundaries | ✅ N/A | No auth changes |
| VI. Lambda Handler Pattern | ✅ N/A | No Lambda changes |
| VII. Frontend Static Export | ✅ PASS | Fonts go in `/public/fonts/`, served as static assets; no SSR required |
| VIII. CDK Infrastructure | ✅ PASS | No CDK changes; fonts served by existing S3 + CloudFront setup |
| IX. Code Quality | ✅ PASS | TypeScript strict; no inline styles introduced; removing legacy CDN dependencies |
| X. Testing Standards | ✅ EXEMPT | Purely presentational — no logic, state, or conditional rendering |
| XI. UX Consistency | ✅ PASS | Tailwind utility classes maintained throughout; updates the design tokens uniformly |
| XII. Performance | ✅ PASS | `font-display: swap` prevents invisible text; fonts cached by CloudFront with long TTL; no new network origins added (CDN fonts removed) |

No violations. Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-rebrand-colors-fonts/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (affected files only)

```text
frontend/
├── pages/
│   └── _document.tsx                          ← remove Google Fonts + Adobe Fonts CDN links
├── styles/
│   └── globals.css                            ← replace @font-face; update DaisyUI theme; update base h1-h6
├── tailwind.config.js                         ← remap fontFamily stacks; update color token values
└── public/
    └── fonts/
        ├── Anton/                             ← NEW (from brand kit)
        │   └── Anton-Regular.ttf
        ├── BricolageGrotesque/               ← NEW (from brand kit)
        │   └── BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf
        ├── AvenirNext/                        ← NEW (from brand kit)
        │   └── Avenir Next.ttc
        ├── Aharoni Font/                      ← DELETE
        └── Horizon Font/                      ← DELETE
```

**Structure Decision**: Single-package web app; frontend-only change. No backend, Lambda, CDK, or shared-types changes required.

---

## Phase 0: Research Findings

*See [research.md](./research.md) for full details. Key decisions summarized here.*

### Font Mapping

Existing Tailwind font-family token names are preserved — only the underlying font stacks change. This means zero component file edits.

| Token | Old Stack | New Stack | Role |
|-------|-----------|-----------|------|
| `font-horizon` | Horizon, Impact, Arial Black | Anton, Impact, Arial Black | Hero / display titles |
| `font-festival` | rig-solid-bold-reverse, Impact | Anton, Impact, Arial Black | Display (remapped to Anton) |
| `font-title` | Montserrat, Inter, system | Bricolage Grotesque, system-sans | Section headings (H1–H3) |
| `font-logo` | Aharoni Bold, Arial Black | Anton, Impact, Arial Black | Logo matching |
| `font-slogan` | Bebas Neue, Impact | *(remove — 0 active usages)* | N/A |

### Color Mapping

| Token | Old Hex | New Hex | Brand Name |
|-------|---------|---------|------------|
| `brand.primary` | `#F7C03E` | `#FCBC3A` | Sunkiss Yellow |
| `brand.primary-dark` | `#B8860B` | `#C99620` | Sunkiss Yellow (dark) |
| `brand.pink` | `#F81889` | `#EA4E9A` | Pulse Pink |
| `brand.accent` | `#18B4DD` | `#40BCB7` | Open Sky Aqua |
| `brand.peach` | `#FEB95F` | `#FEEAD6` | Relaxed Tan |
| `brand.bg` | `#FFFBEF` | `#FAF5F0` | Off White (base bg) |
| `brand.bg-cream` | `#FAF8F5` | `#FAF5F0` | Off White |
| `brand.bg-sand` | `#F2EDE6` | `#FEEAD6` | Relaxed Tan |
| `brand.bg-taupe` | `#E8E3DB` | `#F0E8DC` | Relaxed Tan (mid) |
| `brand.green` | N/A | `#3AAA45` | Valley Green (new token) |

Existing dark/neutral tokens (`brand.header`, `brand.bg-dark`, `brand.neutral.*`) remain — they are not brand palette colors but UI infrastructure colors.

### TTC File Compatibility

Modern browsers (Chrome 4+, Firefox 3.5+, Safari 3.1+, Edge all versions) support `.ttc` (TrueType Collection) files natively when referenced in `@font-face` with `format('truetype')`. The brand kit `Avenir Next.ttc` can be used directly. Individual weights/styles within the collection are selected by the browser based on `font-weight` and `font-style` descriptors in the `@font-face` rule — no extraction needed.

### CDN Font Removal

Removing Google Fonts and Adobe Fonts CDN links from `_document.tsx` eliminates two external network dependencies on every page load, which is a performance improvement. All three fonts are now self-hosted from `/public/fonts/` and cached by CloudFront.

---

## Phase 1: Design

*No data model or API contracts apply — this is a purely visual change.*

### Design Decisions

**1. No component edits required**  
By remapping the existing Tailwind font token stacks rather than renaming them, all 40+ usages across ~20 component and page files are updated automatically. The only source code files touched are the 3 config/style files and `_document.tsx`.

**2. Font directory structure**  
New fonts go into subdirectories under `/public/fonts/` matching the brand kit naming. Old directories (`Aharoni Font/`, `Horizon Font/`) are deleted. The `README.md` in `/public/fonts/` should be updated or removed.

**3. DaisyUI theme colors updated at the CSS variable level**  
DaisyUI v5 reads theme colors from CSS custom properties in the `[data-theme="connect"]` block in `globals.css`. Updating these CSS variables automatically applies to all DaisyUI components (buttons, inputs, badges) without touching any component JSX.

**4. Base heading styles**  
The `@layer base` rule applies `text-brand-pink` to all H1–H6 headings. After the rebrand, `brand-pink` becomes Pulse Pink (#EA4E9A) — a slightly softer hot pink — maintaining the vibrant heading look with the new brand color.

**5. `theme-color` meta tag**  
The mobile browser chrome `theme-color` is currently `#D99B2A` (a dark gold). Update to `#FCBC3A` (Sunkiss Yellow) to match the new primary brand color.

**6. Gradient utilities in globals.css**  
The `gradient-text`, `gradient-bg`, `title-beats`, and `title-beltline` utilities use hardcoded colors (`#F81889`, `#8C52FF`, `#5CE1E6`, `#FEB95F`). These are in `globals.css` as `@layer utilities` with literal hex values — they must be updated to use the new brand colors alongside the Tailwind token changes. These utilities are part of the "Beats on the Beltline" legacy and can be simplified or removed if they're no longer needed for the new "Beats on the Block" brand.

### Files Changed (complete list)

| File | Change Type | What Changes |
|------|-------------|--------------|
| `frontend/pages/_document.tsx` | Edit | Remove Google Fonts + Adobe Fonts `<link>` tags; update theme-color |
| `frontend/styles/globals.css` | Edit | Replace @font-face (Aharoni, Horizon → Anton, Bricolage, Avenir Next); update DaisyUI theme CSS vars; update gradient utility hex values |
| `frontend/tailwind.config.js` | Edit | Remap font family stacks; update brand color hex values; add `brand.green` token |
| `frontend/public/fonts/Anton/` | Add | Copy `Anton-Regular.ttf` from brand kit |
| `frontend/public/fonts/BricolageGrotesque/` | Add | Copy variable font `.ttf` from brand kit |
| `frontend/public/fonts/AvenirNext/` | Add | Copy `Avenir Next.ttc` from brand kit |
| `frontend/public/fonts/Aharoni Font/` | Delete | Remove legacy font |
| `frontend/public/fonts/Horizon Font/` | Delete | Remove legacy font |

**Total**: 3 source edits + 3 font dir additions + 2 font dir deletions. **Zero component file changes.**
