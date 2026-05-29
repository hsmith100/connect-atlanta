# Quickstart: Secret Lineup Reveal Page

**Feature**: 006-secret-lineup

## Prerequisites

Before development, the following files must be in place:

1. `frontend/public/images/Logo/<logo2-filename>` — the "Presented by AHS" logo image (user-supplied)
2. `frontend/public/images/lineup.png` — the final performer lineup image (user-supplied)

## Running Locally

```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:3000/secret-lineup` to preview the page.

The dev server proxies `/api/*` to the staging API — no API calls are made by this page, so no backend setup is needed.

## Verifying Correct Behavior

1. Page loads at `/lineup` with title "Secret Lineup"
2. Logo 2 (AHS) displays below the title
3. Full sponsor blurb text is present
4. Clicking the AHS link opens `ahsdoctors.com` in a new tab
5. `lineup.png` renders below the sponsor section
6. Browser developer tools → `<head>` contains `<meta name="robots" content="noindex, nofollow" />`
7. Inspecting `Header.tsx` nav links — no `/lineup` entry present

## Building & Deploying

```bash
cd frontend
npm run build   # generates /out static export
```

The CI/CD pipeline handles deployment automatically on PR (→ dev) and merge to main (→ staging → prod).
