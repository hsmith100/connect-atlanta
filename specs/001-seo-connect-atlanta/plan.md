# Implementation Plan: SEO Rebrand — Connect Atlanta Ownership Attribution

**Branch**: `001-seo-connect-atlanta` | **Date**: 2026-06-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-seo-connect-atlanta/spec.md`

## Summary

Replace "Atlanta EDM Festival" with Connect Atlanta ownership signals across all SEO metadata and structured data. Two root problems: (1) the default `<title>` names a specific advertising partner org (Atlanta EDM) as the festival's identity; (2) no structured data exists to tell search engines and AI models that Connect Atlanta owns Beats on the Block. Fix is entirely in the Next.js frontend — no Lambda, CDK, or DynamoDB changes.

## Technical Context

**Language/Version**: TypeScript 5.x / TSX
**Primary Dependencies**: Next.js (static export), React, next/head (Head component for meta tags)
**Storage**: N/A — no data model changes
**Testing**: Jest + React Testing Library (`frontend/`) — two existing tests in `SEO.test.tsx` assert old default values and must be updated
**Target Platform**: Static CloudFront distribution (beatsontheblockfest.com)
**Project Type**: Web application — frontend only
**Performance Goals**: No impact — only meta tag / JSON-LD content changes; no rendering or runtime cost added
**Constraints**: Next.js static export — no SSR. JSON-LD must be renderable client-side via `dangerouslySetInnerHTML` in `<Head>`. Per-event structured data on events page is generated client-side from fetched event data.
**Scale/Scope**: 11 page files + 1 shared SEO component + 1 test file

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Stack Fidelity | ✅ Pass | Frontend-only changes; no new runtimes, services, or dependencies |
| II. Simplicity First | ✅ Pass | No new abstractions; string values and JSON-LD objects only |
| III. Environment Discipline | ✅ Pass | No environment-specific code changes |
| IV. DynamoDB Is Source of Truth | ✅ Pass | No data model changes |
| V. Security Boundaries | ✅ Pass | No auth or secret handling |
| VI. Lambda Handler Pattern | ✅ Pass | No Lambda changes |
| VII. Frontend Static Export | ✅ Pass | JSON-LD renders in `<Head>` as a script tag — static-export compatible. Client-side `useMemo` on events page is already the pattern used for data fetching. |
| VIII. CDK Infrastructure | ✅ Pass | No infrastructure changes |
| IX. Code Quality | ✅ Pass | TypeScript strict; no `any`; no unused imports |
| X. Testing Standards | ✅ Pass | Two existing default-value tests in `SEO.test.tsx` must be updated to match new defaults. No new logic → no new test cases required beyond fixing broken assertions. |
| XI. UX Consistency | ✅ Pass | No UI changes — meta tags only |
| XII. Performance | ✅ Pass | JSON-LD adds ~500 bytes to homepage `<head>`; no runtime cost |

## Project Structure

### Documentation (this feature)

```text
specs/001-seo-connect-atlanta/
├── plan.md              # This file
├── research.md          # Phase 0 output — JSON-LD schema decisions
├── quickstart.md        # Development guide
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (files changed by this feature)

```text
frontend/
├── components/
│   └── shared/
│       ├── SEO.tsx               # [CHANGE] Update default title, description, keywords, author, og:site_name
│       └── SEO.test.tsx          # [CHANGE] Update 2 default-value assertions to match new defaults
└── pages/
    ├── index.tsx                 # [CHANGE] Update SEO props + add @graph structured data (Organization + EventSeries + WebSite)
    ├── events.tsx                # [CHANGE] Update SEO props + add @graph structured data (Organization + per-event MusicEvent)
    ├── gallery.tsx               # [CHANGE] Update SEO description to name Connect Atlanta
    ├── join.tsx                  # [CHANGE] Update SEO description to name Connect Atlanta
    ├── contact.tsx               # [CHANGE] Update SEO description to name Connect Atlanta
    ├── merch.tsx                 # [CHANGE] Update SEO description to name Connect Atlanta
    ├── sponsor-inquiries.tsx     # [CHANGE] Update SEO description to name Connect Atlanta
    ├── cookie-policy.tsx         # [CHANGE] Update SEO description to name Connect Atlanta
    ├── privacy-policy.tsx        # [CHANGE] Update SEO description to name Connect Atlanta
    ├── terms-conditions.tsx      # [CHANGE] Update SEO description to name Connect Atlanta
    └── 404.tsx                   # [CHANGE] Update SEO title/description to name Connect Atlanta
```

**Structure Decision**: Existing frontend layout. No new files or directories. All changes are edits to existing files.

## Implementation Details

### Task 1 — Update SEO component defaults (`SEO.tsx`)

Change three default values:

| Field | Old value | New value |
|-------|-----------|-----------|
| `title` | `'Connect Events - Beats on the Block \| Atlanta EDM Festival'` | `'Beats on the Block \| Connect Atlanta'` |
| `description` | `'Atlanta\'s premier FREE outdoor electronic music experience...'` | `'Beats on the Block is Atlanta\'s premier free outdoor music festival, produced by Connect Atlanta. Join thousands of fans for world-class DJs and community vibes along the BeltLine.'` |
| `keywords` | `'atlanta events, beats on the block, edm atlanta, electronic music festival, atlanta beltline, free concerts atlanta, outdoor music atlanta, atlanta edm, house music atlanta, techno atlanta'` | `'beats on the block, connect atlanta, atlanta music festival, free outdoor festival, atlanta beltline, electronic music atlanta, house music atlanta, outdoor concerts atlanta, connect events'` |
| `author` meta | `'Connect Events, Inc.'` | `'Connect Atlanta'` |
| `og:site_name` | `'Connect Events'` | `'Connect Atlanta'` |

### Task 2 — Update SEO test assertions (`SEO.test.tsx`)

Two tests check old default values and will fail after Task 1:
- `'renders the default title'` — asserts `document.title` contains `'Connect Events'` → update to assert contains `'Beats on the Block'`
- `'renders the default description meta tag'` — asserts content contains `"Atlanta's premier FREE"` → update to assert contains `'Connect Atlanta'`

### Task 3 — Homepage structured data (`index.tsx`)

Add `structuredData` prop to the existing `<SEO>` call. Pass an `@graph` object containing:
1. `Organization` — Connect Atlanta (with `sameAs` social links)
2. `EventSeries` — Beats on the Block, `organizer: { @id: ".../#org" }`
3. `WebSite` — beatsontheblockfest.com, `publisher: { @id: ".../#org" }`

Also update the homepage `keywords` prop to remove "atlanta edm" and add "connect atlanta".

### Task 4 — Events page structured data (`events.tsx`)

Add `structuredData` prop to the existing `<SEO>` call. The structured data must be reactive to loaded events, so use `useMemo`:

```typescript
const structuredData = useMemo(() => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://beatsontheblockfest.com/#org',
      'name': 'Connect Atlanta',
      'url': 'https://beatsontheblockfest.com',
    },
    ...upcomingEvents.map(event => ({
      '@type': 'MusicEvent',
      'name': event.title,
      'startDate': event.date,
      'url': 'https://beatsontheblockfest.com/events',
      'eventStatus': 'https://schema.org/EventScheduled',
      'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
      'organizer': { '@id': 'https://beatsontheblockfest.com/#org' },
      'location': {
        '@type': 'Place',
        'name': 'Atlanta BeltLine',
        'address': { '@type': 'PostalAddress', 'addressLocality': 'Atlanta', 'addressRegion': 'GA', 'addressCountry': 'US' },
      },
    })),
  ],
}), [upcomingEvents])
```

Pass `structuredData` to `<SEO>`. When `upcomingEvents` is empty (loading or no events), the `@graph` still contains the `Organization` node — Connect Atlanta attribution is always present.

Also update the events page `<SEO>` description to name Connect Atlanta as organizer.

### Task 5 — Per-page description updates (all remaining pages)

Update the `description` prop on `<SEO>` for each of these pages to name Connect Atlanta as the organizer. Title format stays `"[Page] | Beats on the Block"` — Connect Atlanta attribution goes in the description.

| Page | Description update |
|------|--------------------|
| `gallery.tsx` | `"Browse photos from Beats on the Block events, produced by Connect Atlanta — Atlanta's premier free outdoor music festival."` |
| `join.tsx` | `"Join the Beats on the Block crew. Apply as a volunteer, vendor, or DJ for Connect Atlanta's free outdoor music festival on the Atlanta BeltLine."` |
| `contact.tsx` | `"Get in touch with Connect Atlanta, organizers of Beats on the Block. Reach out about partnerships, performances, or general inquiries."` |
| `merch.tsx` | `"Shop official Beats on the Block merchandise from Connect Atlanta. Festival apparel, accessories, and more."` |
| `sponsor-inquiries.tsx` | `"Partner with Connect Atlanta to sponsor Beats on the Block — Atlanta's premier free outdoor music festival reaching 5,000–10,000 attendees."` |
| `cookie-policy.tsx` | `"Learn how Connect Atlanta uses cookies and similar technologies on the Beats on the Block website."` |
| `privacy-policy.tsx` | `"Connect Atlanta's privacy policy for the Beats on the Block website."` |
| `terms-conditions.tsx` | `"Terms and conditions for the Beats on the Block website, operated by Connect Atlanta."` |
| `404.tsx` | Title: `"Page Not Found | Beats on the Block"` / Description: `"The page you're looking for doesn't exist. Head back to the Beats on the Block homepage — produced by Connect Atlanta."` |

## Validation

After implementing, verify with page source inspection:

- `grep "Atlanta EDM" frontend/pages/**/*.tsx frontend/components/shared/SEO.tsx` → zero matches in SEO metadata context
- `grep "atlanta edm\|edm atlanta" frontend/pages/**/*.tsx frontend/components/shared/SEO.tsx` → zero matches in keywords
- Each page `<title>` starts with "Beats on the Block"
- `og:site_name` = "Connect Atlanta" on all pages
- `author` meta = "Connect Atlanta" on all pages
- `script[type="application/ld+json"]` present on homepage and events page
- JSON-LD on homepage contains `@type: Organization` with `name: Connect Atlanta`
- Run `npm test -- --ci` in `frontend/` → all tests pass (including updated SEO defaults)
