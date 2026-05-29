# Quickstart: Sponsor Updates & AHS Presented-By Hero Placement

**Branch**: `007-sponsor-updates`

## What changed

1. **`frontend/components/home/HeroSection.tsx`** — AHS "Presented By" logo added below BOTB logo
2. **`frontend/components/home/SponsorsSection.tsx`** — Sponsors grid updated to 2026 PNG logos

## Run locally

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

## Test checklist

### Hero — AHS logo
- [ ] Desktop (≥768px): BOTB logo visible, AHS logo directly below it, centered, no overlap
- [ ] Mobile (<768px): AHS logo visible at top of hero content, BOTB logo correctly hidden
- [ ] AHS logo is legible — not too small, not overwhelming the BOTB logo
- [ ] No layout breaks or overflow in the hero section

### Sponsors section
- [ ] Scroll down to the Sponsors section
- [ ] All 13 new logos (3.png–15.png) are visible; no old SVG logos remain
- [ ] Logos are uniform in size and not distorted
- [ ] Grid responds correctly at mobile (3 cols), tablet (4 cols), desktop (6 cols)
- [ ] No broken image placeholders (all 13 files are present in `public/images/Sponsor Logos 2026/`)

## Provide sponsor names (optional but recommended)

To replace the `Sponsor N` placeholder alt text with real names, edit the `SPONSORS_2026` array in `SponsorsSection.tsx`:

```ts
const SPONSORS_2026 = [
  { name: 'Actual Sponsor Name', logo: '/images/Sponsor Logos 2026/3.png' },
  // …
]
```

## Assets

All logo images are already committed under:
```
frontend/public/images/Sponsor Logos 2026/
  2.png   ← AHS "Presented By" logo (hero)
  3.png – 15.png  ← 2026 sponsor grid
```
