# Data Model: SendGrid Email Authentication DNS Records

**Feature**: 003-sendgrid-dns-auth  
**Date**: 2026-04-29

> This feature has no application data model (no DynamoDB tables, no Lambda state). The "data" is the DNS records themselves, documented here as the authoritative source of the exact values to be deployed.

## DNS Records to Add

All records belong to the `connectevents.co` Route53 hosted zone.

| Type  | Name/Host       | Target/Value                                  | Purpose                          |
|-------|-----------------|-----------------------------------------------|----------------------------------|
| CNAME | `em335`         | `u40615086.wl087.sendgrid.net`                | SendGrid email link tracking     |
| CNAME | `s1._domainkey` | `s1.domainkey.u40615086.wl087.sendgrid.net`   | DKIM signing key 1               |
| CNAME | `s2._domainkey` | `s2.domainkey.u40615086.wl087.sendgrid.net`   | DKIM signing key 2               |
| TXT   | `_dmarc`        | `v=DMARC1; p=none;`                           | DMARC monitoring policy          |

## Existing Records (Unchanged)

| Type | Name/Host | Value | Purpose |
|------|-----------|-------|---------|
| MX   | `@`       | Google Workspace MX servers (5 entries) | Inbound email routing |
| TXT  | `@`       | `v=spf1 include:_spf.google.com ~all`   | Outbound SPF for Google Workspace |
| A    | `@`, `www`| CloudFront IPs (managed by FrontendStack) | Web traffic |

## Validation Rules

- CNAME record names MUST be entered exactly as shown — no trailing dot, no full domain suffix
- DMARC value string MUST be wrapped in a single `values: [...]` array entry in CDK
- CDK `recordName` is relative to the zone — `em335` resolves to `em335.connectevents.co` automatically
