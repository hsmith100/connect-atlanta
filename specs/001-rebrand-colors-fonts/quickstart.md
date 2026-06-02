# Quickstart: Rebrand Site Colors and Fonts

**Branch**: `001-rebrand-colors-fonts`  
**Scope**: Frontend styling only — 3 source edits + font file additions/removals. Zero component changes.

---

## Overview

This feature updates 4 things:

1. **Font files** — Copy 3 new brand fonts to `/public/fonts/`, delete 2 old ones
2. **`_document.tsx`** — Remove Google Fonts + Adobe Fonts CDN links; update theme-color
3. **`globals.css`** — Replace @font-face declarations; update DaisyUI color variables; update gradient utilities
4. **`tailwind.config.js`** — Remap font family stacks; update brand color hex values; add Valley Green token

---

## Step 1: Font Files

**Copy from brand kit** to `/public/fonts/`:

```text
FROM: /Users/huntersmith/Downloads/Final Brand Elements/Fonts/Anton - Logo Font/Anton-Regular.ttf
TO:   frontend/public/fonts/Anton/Anton-Regular.ttf

FROM: /Users/huntersmith/Downloads/Final Brand Elements/Fonts/Bricolage Grotesque - Headline Font/BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf
TO:   frontend/public/fonts/BricolageGrotesque/BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf

FROM: /Users/huntersmith/Downloads/Final Brand Elements/Fonts/Avenir Next - Body Copy Font/Avenir Next.ttc
TO:   frontend/public/fonts/AvenirNext/Avenir Next.ttc
```

**Delete** legacy font directories:
```text
frontend/public/fonts/Aharoni Font/   ← delete
frontend/public/fonts/Horizon Font/   ← delete
```

---

## Step 2: `frontend/pages/_document.tsx`

Remove the 4 Google Fonts `<link>` tags (preconnect + stylesheet).  
Remove the 2 Adobe Fonts `<link>` tags (preconnect + stylesheet).  
Update `theme-color` from `#D99B2A` to `#FCBC3A`.

---

## Step 3: `frontend/styles/globals.css`

### Replace @font-face declarations

Remove `Aharoni Bold` and `Horizon` @font-face rules. Add:

```css
@font-face {
    font-family: 'Anton';
    src: url('/fonts/Anton/Anton-Regular.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Bricolage Grotesque';
    src: url('/fonts/BricolageGrotesque/BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf') format('truetype');
    font-weight: 100 900;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Avenir Next';
    src: url('/fonts/AvenirNext/Avenir Next.ttc') format('truetype');
    font-weight: 100 900;
    font-style: normal;
    font-display: swap;
}
```

### Update DaisyUI theme `[data-theme="connect"]`

| Variable | Old | New |
|---|---|---|
| `--color-primary` | `#F7C03E` | `#FCBC3A` |
| `--color-secondary` | `#B8860B` | `#C99620` |
| `--color-accent` | `#18B4DD` | `#40BCB7` |
| `--color-warning` | `#D99B2A` | `#C99620` |
| `--color-base-100` | `#FFFFFF` | `#FFFFFF` (keep) |
| `--color-base-200` | `#F9F7F4` | `#FAF5F0` |
| `--color-base-300` | `#F2EDE6` | `#FEEAD6` |

### Update gradient utilities

Update hardcoded hex colors in `@layer utilities`:
- `.glow-pink`: `rgba(248, 24, 137, 0.5)` → `rgba(234, 78, 154, 0.5)`
- `.glow-purple`: remove (no purple in new palette)
- `.glow-gold`: `rgba(217, 155, 42, 0.6)` → `rgba(252, 188, 58, 0.6)`
- `.gradient-text-pink`: `#F81889` → `#EA4E9A`, `#FF5722` → `#FCBC3A`
- `.hero-gradient-gold`: `#FFFDF3` → `#FAF5F0`, `#FFD983` → `#FCBC3A`
- `.title-beats`: `#FEB95F` → `#FCBC3A`, `#F81889` → `#EA4E9A`, `#8C52FF` → `#40BCB7`
- `.title-beltline`: `#F81889` → `#EA4E9A`, `#8C52FF` → `#40BCB7`, `#5CE1E6` → `#3AAA45`
- `.pulse-glow` and `@keyframes pulse-glow`: `rgba(140, 82, 255)` → `rgba(58, 170, 69, ...)` (Valley Green) or remove if unused

---

## Step 4: `frontend/tailwind.config.js`

### Font families

```js
fontFamily: {
    'festival': ['"Anton"', 'Impact', 'Arial Black', 'sans-serif'],
    'title':    ['"Bricolage Grotesque"', 'system-ui', '-apple-system', 'sans-serif'],
    'logo':     ['"Anton"', 'Impact', 'Arial Black', 'sans-serif'],
    'horizon':  ['"Anton"', 'Impact', 'Arial Black', 'sans-serif'],
    // 'slogan' removed (0 usages)
},
```

### Brand colors

```js
colors: {
    'brand': {
        primary:        '#FCBC3A',  // Sunkiss Yellow
        'primary-dark': '#C99620',  // Sunkiss Yellow dark
        header:         '#1A1A1A',  // keep (UI text, not brand palette)
        text:           '#4A4A4A',  // keep
        'text-light':   '#6B6B6B',  // keep
        bg:             '#FAF5F0',  // Off White
        'bg-cream':     '#FAF5F0',  // Off White
        'bg-sand':      '#FEEAD6',  // Relaxed Tan
        'bg-taupe':     '#F0E8DC',  // Relaxed Tan mid
        'bg-dark':      '#2C2C2C',  // keep (UI dark bg)
        accent:         '#40BCB7',  // Open Sky Aqua
        pink:           '#EA4E9A',  // Pulse Pink
        peach:          '#FEEAD6',  // Relaxed Tan (remapped)
        green:          '#3AAA45',  // Valley Green (new)
        neutral: {
            100: '#FEEAD6',
            200: '#F0E8DC',
            300: '#DDD5C9',
            400: '#C5BDB1',
        },
    },
},
```

---

## Verify

```bash
cd frontend
npm run build   # should complete with no errors
```

Open the dev server and check:
- Home page hero title uses Anton (display font)
- Section headings use Bricolage Grotesque
- Body text uses Avenir Next
- Primary color is Sunkiss Yellow (#FCBC3A), not the old gold (#F7C03E)
- Pink accents are Pulse Pink (#EA4E9A), not the old hot pink (#F81889)
- No requests to fonts.googleapis.com or use.typekit.net in DevTools Network tab

---

## Font Role Reference

| Tailwind Class | Font | Role |
|---|---|---|
| `font-horizon` | Anton | Hero / page display titles |
| `font-festival` | Anton | Section display text |
| `font-title` | Bricolage Grotesque | Section headings (H1–H3) |
| `font-logo` | Anton | Logo-matching text |
| *(default)* | Avenir Next | Body copy, labels, UI text |
