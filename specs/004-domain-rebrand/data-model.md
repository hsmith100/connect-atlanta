# Data Model: Domain Rebrand — connectevents.co → beatsontheblockfest.com

**Branch**: `004-domain-rebrand` | **Date**: 2026-05-04

## Application Data

No application data changes. No DynamoDB tables, Lambda handlers, or frontend data structures are added or modified. All existing application data (events, photos, forms, signups) continues to be stored and accessed identically.

## Infrastructure Entities

This feature introduces two new AWS infrastructure resources and modifies one existing resource. These are CDK constructs, not application data.

### New: beatsontheblockfest.com Hosted Zone

| Property | Value |
|----------|-------|
| Zone name | `beatsontheblockfest.com` |
| Managed in | `ConnectDnsStack` |
| CDK construct | `route53.HostedZone` |
| Records at creation | A, AAAA alias records (apex + www → beatsontheblockfest.com CloudFront distribution) |
| Nameserver update required | Yes — Namecheap must be updated to delegate to Route53 |

### New: beatsontheblockfest.com ACM Certificate

| Property | Value |
|----------|-------|
| Primary domain | `beatsontheblockfest.com` |
| SANs | `www.beatsontheblockfest.com` |
| Validation method | DNS (CNAME auto-created in the beatsontheblockfest.com hosted zone by CDK) |
| Region | `us-east-1` (required for CloudFront) |
| Managed in | `ConnectDnsStack` |
| Used by | beatsontheblockfest.com CloudFront distribution in `ConnectFrontendStack` |

### New: beatsontheblockfest.com CloudFront Distribution

| Property | Value |
|----------|-------|
| Domain aliases | `beatsontheblockfest.com`, `www.beatsontheblockfest.com` |
| Default origin | Same S3 bucket as the existing connectevents.co distribution |
| API origin | Same API Gateway domain as existing distribution (`/api/*`) |
| CloudFront Function | URL-rewrite function (identical logic to existing distribution's current function) |
| Certificate | beatsontheblockfest.com ACM cert |
| Managed in | `ConnectFrontendStack` |

### Modified: connectevents.co CloudFront Distribution (existing)

| Property | Before | After |
|----------|--------|-------|
| Domain aliases | `connectevents.co`, `www.connectevents.co` | Unchanged |
| Certificate | connectevents.co ACM cert | Unchanged |
| CloudFront Function | URL-rewrite (extensionless → .html) | Redirect (301 to beatsontheblockfest.com) |
| S3 origin | connectevents.co S3 bucket | Unchanged (never hit — redirect fires first) |
| Route53 A/AAAA records | Point to this distribution | Unchanged (FR-007: additive-only) |

### Unchanged: connectevents.co DNS Records

All existing Route53 records in the connectevents.co hosted zone are **read-only** for this feature (FR-007). No removals, no modifications.

| Record | Type | Purpose | Status |
|--------|------|---------|--------|
| `connectevents.co` A + AAAA | Alias | Points to existing CloudFront distribution | Unchanged |
| `www.connectevents.co` A + AAAA | Alias | Points to existing CloudFront distribution | Unchanged |
| `@` | MX (Google Workspace) | Email delivery for @connectevents.co | Unchanged |
| `@` | TXT (SPF) | Email sending authentication | Unchanged |
| `em335` | CNAME (SendGrid) | PeerPop marketing email tracking | Unchanged |
| `s1._domainkey` | CNAME (SendGrid DKIM) | PeerPop DKIM signing | Unchanged |
| `s2._domainkey` | CNAME (SendGrid DKIM) | PeerPop DKIM signing | Unchanged |
| `_dmarc` | TXT (DMARC) | Email policy baseline | Unchanged |
