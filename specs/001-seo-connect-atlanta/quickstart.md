# Quickstart: SEO Rebrand — Connect Atlanta Ownership Attribution

## What this feature changes

Metadata-only changes across the Next.js frontend. No backend, Lambda, CDK, or DynamoDB work.

Files changed:
- `frontend/components/shared/SEO.tsx` — default title, description, keywords, author, og:site_name
- `frontend/components/shared/SEO.test.tsx` — update 2 broken assertions
- `frontend/pages/index.tsx` — SEO props + homepage structured data (JSON-LD)
- `frontend/pages/events.tsx` — SEO props + per-event structured data (JSON-LD)
- 9 remaining page files — description prop updates

## Local development

```bash
# Install dependencies (if not already done)
npm ci --prefix frontend

# Start dev server (proxies /api/* to dev API Gateway)
npm run dev --prefix frontend
```

Open http://localhost:3000. Use "View Page Source" to inspect `<head>` — all changes are in the source HTML.

## Verifying structured data

1. Run the dev server and navigate to http://localhost:3000
2. Right-click → View Page Source → search for `application/ld+json`
3. The homepage should have a JSON-LD script with `@type: Organization` and `name: Connect Atlanta`
4. Navigate to http://localhost:3000/events — after events load, the JSON-LD should include `MusicEvent` entries each with `organizer: { @id: ".../#org" }`

Or use Google's Rich Results Test (https://search.google.com/test/rich-results) on the deployed PR environment URL posted in the PR comment.

## Running tests

```bash
npm test -- --ci --prefix frontend
```

Two tests in `SEO.test.tsx` check default values and will fail before the SEO component is updated. They should pass after Task 1 (SEO defaults) and Task 2 (test updates) are complete.

## Key values reference

| Field | New value |
|-------|-----------|
| Default title | `'Beats on the Block \| Connect Atlanta'` |
| Default description | `'Beats on the Block is Atlanta's premier free outdoor music festival, produced by Connect Atlanta...'` |
| og:site_name | `'Connect Atlanta'` |
| author meta | `'Connect Atlanta'` |
| JSON-LD @id (org) | `'https://beatsontheblockfest.com/#org'` |
| JSON-LD org name | `'Connect Atlanta'` |

## What NOT to change

- `secret-lineup.tsx` — already has `noindex: true`; description is fine as-is
- `admin.tsx` — admin page; no public SEO relevance
- `design-system.tsx` — internal page; no public SEO relevance
- Any visible page content mentioning "Atlanta EDM" as an advertising partner — that is acceptable and out of scope
