# Research: Rebrand Site Colors and Fonts

**Feature**: `001-rebrand-colors-fonts`  
**Date**: 2026-05-27  
**Status**: Complete — all questions resolved

---

## Q1: Exact brand color hex values

**Decision**: Values extracted from XMP metadata embedded in the brand PDF and validated against logo PNG files.

| Color Name | Hex | Source |
|---|---|---|
| Sunkiss Yellow | `#FCBC3A` | XMP: R=252 G=188 B=58 |
| Pulse Pink | `#EA4E9A` | XMP: R=234 G=78 B=154 |
| Open Sky Aqua | `#40BCB7` | XMP: R=64 G=188 B=183 |
| Valley Green | `#3AAA45` | XMP: R=58 G=170 B=69 |
| Relaxed Tan | `#FEEAD6` | XMP: R=254 G=234 B=214 |
| Off White | `#FAF5F0` | PNG pixel sampling |
| Black | `#000000` | Standard |

**Rationale**: XMP color swatches embedded in a PDF are set by the designer in the design application and represent the authoritative intended values. Pixel sampling from the logo PNGs confirmed values within ±5 per channel (variance from PNG compression/gamma encoding).

---

## Q2: TTC file compatibility for web use

**Decision**: Use `Avenir Next.ttc` directly in `@font-face` declarations.

**Rationale**: TrueType Collection (`.ttc`) files are natively supported in all modern browsers:
- Chrome: supported since v4
- Firefox: supported since v3.5
- Safari: supported since v3.1
- Edge: all versions

Reference via `src: url('/fonts/AvenirNext/Avenir Next.ttc') format('truetype')`. The browser selects the appropriate face from the collection based on the `font-weight` and `font-style` descriptors in each `@font-face` rule. No extraction or conversion needed.

**Alternatives considered**:
- Extract individual `.ttf` faces from the `.ttc` using fonttools — rejected; adds tooling complexity with no practical benefit for this browser target.
- Convert to `.woff2` for smaller file size — deferred; `.ttc` served from CloudFront with gzip/br compression provides acceptable performance. If load times become a concern post-deploy, a follow-up optimization PR can convert to `.woff2`.

---

## Q3: Font weight coverage for Bricolage Grotesque

**Decision**: Use the variable font file `BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf`.

**Rationale**: The brand kit provides a variable font that covers the full weight range (`wght` axis) plus optical size (`opsz`) and width (`wdth`) axes. A single `@font-face` declaration with `font-weight: 100 900` loads all weights, matching the existing usage patterns (`font-bold`, `font-semibold`, etc.) without any additional files.

---

## Q4: Tailwind font token naming strategy

**Decision**: Keep existing token names (`font-horizon`, `font-title`, `font-festival`, `font-logo`); remap the underlying font stacks. Remove `font-slogan` (zero usages).

**Rationale**: The audit found ~40 usages of these tokens across ~20 files. Renaming tokens would require editing every component — high blast radius with zero user-facing value. Remapping the stacks achieves the rebrand goal (Tailwind reads the new stack at build time) with zero component file changes.

**Mapping**:
- `font-horizon` → Anton (hero/display titles — 9 usages in page headers)
- `font-title` → Bricolage Grotesque (section headings — 24 usages)
- `font-festival` → Anton (display text — 3 usages in ExperienceSection, UpcomingEventCard)
- `font-logo` → Anton (logo matching — 0 component usages, safe to remap)
- `font-slogan` → removed from config (0 usages)

---

## Q5: Color token compatibility — `brand-peach` usage

**Decision**: Remap `brand-peach` to Relaxed Tan (`#FEEAD6`).

**Rationale**: `brand-peach` (#FEB95F) appeared in gradient effects alongside `brand-pink`. The new palette has no direct orange-peach equivalent. Relaxed Tan (#FEEAD6) is the warmest light accent in the new palette. Gradient combinations using `from-brand-primary via-brand-pink to-brand-accent` (Sunkiss Yellow → Pulse Pink → Open Sky Aqua) create a natural festival palette gradient without needing `brand-peach` as an intermediary. The `brand-peach` token is retained (mapped to Relaxed Tan) to avoid breaking any usages — no component edits required.

---

## Q6: Legacy gradient utilities in globals.css

**Decision**: Update hardcoded hex colors in gradient utilities to new brand values; retire Beltline-specific utilities.

**Affected utilities and new values**:

| Utility | Old Colors | New Colors |
|---|---|---|
| `.gradient-text` | primary → pink → accent | Sunkiss Yellow → Pulse Pink → Open Sky Aqua |
| `.gradient-bg` | header → primary → pink | Black → Sunkiss Yellow → Pulse Pink |
| `.gradient-text-pink` | #F81889 → #FF5722 | Pulse Pink → Sunkiss Yellow (sunset feel) |
| `.glow-pink` | rgba(248, 24, 137) | rgba(234, 78, 154) — Pulse Pink |
| `.glow-purple` | rgba(140, 82, 255) | Remove — no purple in new palette |
| `.glow-gold` | rgba(217, 155, 42) | rgba(252, 188, 58) — Sunkiss Yellow |
| `.hero-gradient-gold` | #FFFDF3 → #FFD983 | Off White → Sunkiss Yellow |
| `.title-beats` | FEB95F → F81889 → 8C52FF | Sunkiss Yellow → Pulse Pink → Open Sky Aqua |
| `.title-beltline` | F81889 → 8C52FF → 5CE1E6 | Pulse Pink → Open Sky Aqua (simplify, drop purple) |
| `.pulse-glow` | rgba(140, 82, 255) | Remove or remap to brand-green |

---

## Q7: External font CDN removal impact

**Decision**: Remove Google Fonts and Adobe Fonts CDN links from `_document.tsx`.

**Impact**: 
- Eliminates two `preconnect` + stylesheet requests on every page load
- Removes dependency on external services (no GDPR/privacy concern with self-hosted fonts)
- Fonts are now served from `connectevents.co/fonts/...` via CloudFront with long-TTL caching
- Performance neutral-to-positive: fewer DNS lookups, fewer blocking stylesheets, same font render behavior via `font-display: swap`

---

## Q8: Avenir Next Tailwind font stack fallback

**Decision**: `['Avenir Next', 'Avenir', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']`

**Rationale**: On Apple platforms (macOS, iOS) where Avenir Next is a system font, the browser may use the system copy before the web font loads, eliminating flash. The web font file is loaded as a supplement for non-Apple devices. Fallbacks degrade gracefully through common system sans-serif fonts.
