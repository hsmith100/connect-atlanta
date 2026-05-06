# connect-atlanta Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-22

## Active Technologies
- TypeScript 5.x (CDK infrastructure only) + `aws-cdk-lib` v2 — `aws_route53.CnameRecord`, `aws_route53.TxtRecord` (003-sendgrid-dns-auth)
- TypeScript 5.x (CDK infrastructure only) + `aws-cdk-lib` v2 — `aws_route53.HostedZone`, `aws_acm.Certificate`, `aws_cloudfront.Distribution`, `aws_cloudfront.Function` (004-domain-rebrand)
- N/A — no application data changes (004-domain-rebrand)

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
- 004-domain-rebrand: Added TypeScript 5.x (CDK infrastructure only) + `aws-cdk-lib` v2 — `aws_route53.HostedZone`, `aws_acm.Certificate`, `aws_cloudfront.Distribution`, `aws_cloudfront.Function`
- 003-sendgrid-dns-auth: Added TypeScript 5.x (CDK infrastructure only) + `aws-cdk-lib` v2 — `aws_route53.CnameRecord`, `aws_route53.TxtRecord`

- 001-show-merch-tab: Added TypeScript 5.x / TSX + Next.js (static export), React, Tailwind CSS

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
