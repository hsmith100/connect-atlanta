# connect-atlanta Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-22

## Active Technologies
- TypeScript 5.x (CDK infrastructure only) + `aws-cdk-lib` v2 — `aws_route53.CnameRecord`, `aws_route53.TxtRecord` (003-sendgrid-dns-auth)
- TypeScript 5.x (CDK infrastructure only) + `aws-cdk-lib` v2 — `aws_route53.HostedZone`, `aws_acm.Certificate`, `aws_cloudfront.Distribution`, `aws_cloudfront.Function` (004-domain-rebrand)
- N/A — no application data changes (004-domain-rebrand)
- TypeScript 5.x (CDK infrastructure) / TypeScript 5.x (Lambda Node.js 20.x) + `aws-cdk-lib` v2 — `aws_ses.EmailIdentity`, `aws_route53` record types; `@aws-sdk/client-ses` (Lambda, no code changes) (005-switch-email-domain)
- N/A — no data model changes (005-switch-email-domain)
- TypeScript 5.x / TSX (Next.js) + Next.js (static export), React, Tailwind CSS — all existing (006-secret-lineup)
- N/A — entirely static conten (006-secret-lineup)
- TypeScript 5.x / TSX (Next.js static export) + Next.js, React, Tailwind CSS (007-sponsor-updates)
- N/A — logo PNGs already committed to `public/images/Sponsor Logos 2026/` (007-sponsor-updates)
- TypeScript 5.x / TSX — Next.js 16.x (static export) + Tailwind CSS v4 (CSS-first config via `@config`), DaisyUI v5, Next.js static expor (001-rebrand-colors-fonts)

- TypeScript 5.x / TSX + Next.js (static export), React, Tailwind CSS (001-show-merch-tab)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x / TSX: Follow standard conventions

## Recent Changes
- 001-rebrand-colors-fonts: Added TypeScript 5.x / TSX — Next.js 16.x (static export) + Tailwind CSS v4 (CSS-first config via `@config`), DaisyUI v5, Next.js static expor
- 007-sponsor-updates: Added TypeScript 5.x / TSX (Next.js static export) + Next.js, React, Tailwind CSS
- 006-secret-lineup: Added TypeScript 5.x / TSX (Next.js) + Next.js (static export), React, Tailwind CSS — all existing
- 005-switch-email-domain: Added TypeScript 5.x (CDK infrastructure) / TypeScript 5.x (Lambda Node.js 20.x) + `aws-cdk-lib` v2 — `aws_ses.EmailIdentity`, `aws_route53` record types; `@aws-sdk/client-ses` (Lambda, no code changes)
- 004-domain-rebrand: Added TypeScript 5.x (CDK infrastructure only) + `aws-cdk-lib` v2 — `aws_route53.HostedZone`, `aws_acm.Certificate`, `aws_cloudfront.Distribution`, `aws_cloudfront.Function`


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
