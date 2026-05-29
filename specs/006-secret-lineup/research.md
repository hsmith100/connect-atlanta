# Research: Secret Lineup Reveal Page

**Feature**: 006-secret-lineup  
**Date**: 2026-05-29

---

## Decision 1: noindex Implementation

**Decision**: Use the existing `SEO` component's `noindex` prop (`noindex={true}`).

**Rationale**: `frontend/components/shared/SEO.tsx` already has a `noindex?: boolean` prop that emits `<meta name="robots" content="noindex, nofollow" />` when true. No new mechanism needed.

**Alternatives considered**: Updating `robots.txt` to `Disallow: /lineup` — rejected because robots.txt controls crawl access, not indexing. A `noindex` meta tag is the correct standard for a page that should be accessible but not indexed. Also: `/secret-lineup` is not under `/admin`, so a robots.txt disallow alone would still not suppress it from Google's index if it had already been discovered.

---

## Decision 2: Navigation Exclusion

**Decision**: Simply do not add a `/secret-lineup` entry to `Header.tsx`. No conditional rendering or feature-flag logic needed.

**Rationale**: Nav links in `Header.tsx` are hardcoded — the desktop and mobile nav each have explicit `href` entries. Omitting `/secret-lineup` from both lists is sufficient. No Header modification is required.

**Alternatives considered**: Dynamically hiding the link — unnecessary complexity for a page that is intentionally unlisted.

---

## Decision 3: Sitemap Exclusion

**Decision**: Do not add `/secret-lineup` to `frontend/public/sitemap.xml`.

**Rationale**: `sitemap.xml` is a static file that lists pages intended for search engine discovery. The secret lineup page is explicitly noindex and should not be advertised to crawlers via sitemap either.

**Alternatives considered**: Adding it anyway — rejected, contradicts the noindex requirement.

---

## Decision 4: Logo 2 Asset

**Decision**: Logo 2 is confirmed as `frontend/public/images/Sponsor Logos 2026/2.png` — the "PRESENTED BY Advanced Health Solutions" co-branded logo. Reference it in the page as `/images/Sponsor Logos 2026/2.png`.

**Rationale**: Asset already exists in the repository. No new file needed. The space in the directory name is handled naturally by the browser when the path is used as an `src` attribute value.

**Alternatives considered**: Renaming the file to remove spaces — unnecessary; the browser handles URL encoding transparently for `src` attributes.

---

## Decision 5: Lineup Image Placement

**Decision**: The lineup image is confirmed as `frontend/public/images/Final Lineup.png`. Reference it in the page as `/images/Final Lineup.png`.

**Rationale**: Asset already exists in the repository under `frontend/public/`. No new file needed.

**Alternatives considered**: Serving from the media CloudFront distribution — overkill for a single static image that doesn't need admin management or thumbnails. Simpler to bundle it with the frontend build.

---

## Decision 6: Page File Location

**Decision**: Create `frontend/pages/lineup.tsx` as a standard Next.js page.

**Rationale**: Matches the established pattern for all other pages in the project. The static export generates `/lineup/index.html` (or `/lineup.html`) which CloudFront serves at the `/secret-lineup` path.

**Alternatives considered**: Dynamic route (`frontend/pages/[slug].tsx`) — unnecessary, there is only one secret lineup page.

---

## Decision 7: Testing

**Decision**: No unit tests required for this page.

**Rationale**: Per Constitution Principle X, "Next.js page files that are thin wrappers around tested components" and "Purely presentational components with no logic" are exempt from the unit test mandate. The lineup page is entirely presentational: static text, two images, one external link, and no state or API calls.

---

## Prerequisites

Both required assets are already present in the repository:

1. **Logo 2 (AHS)** — `frontend/public/images/Sponsor Logos 2026/2.png` ✅
2. **Lineup image** — `frontend/public/images/Final Lineup.png` ✅

No user action required before implementation.
