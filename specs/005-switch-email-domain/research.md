# Research: Switch Email Domain to beatsontheblockfest.com

## Current State Findings

### What exists today

| Resource | connectevents.co | beatsontheblockfest.com |
|----------|-----------------|------------------------|
| Route53 hosted zone | ✅ DnsStack | ✅ DnsStack (`beatsontheblockfestHostedZone`) |
| ACM certificate | ✅ DnsStack | ✅ DnsStack (`beatsontheblockfestCertificate`) |
| MX records (inbound email) | ✅ Google Workspace | ❌ Missing |
| SPF record | ✅ `v=spf1 include:_spf.google.com ~all` | ❌ Missing |
| DKIM records | ✅ SendGrid CNAME records (s1/s2._domainkey) | ❌ Missing |
| DMARC record | ✅ `v=DMARC1; p=none;` | ❌ Missing |
| SES domain identity | ❌ Not in CDK (Phase 5 note says "manual") | ❌ Missing entirely |

### Lambda email config (backend-stack.ts)

- `FROM_EMAIL` env var: hardcoded `'noreply@connectevents.co'` (used by all environments)
- `CONTACT_EMAIL` env var: prop `contactEmail`, defaulting to `'info@connectevents.co'` for prod; staging/dev/PR use `'productions.connectatlanta@gmail.com'`
- SES IAM policy: `ses:SendEmail` + `ses:SendRawEmail` with `resources: ['*']` — already broad enough, no change needed
- `formShared.ts` reads both from `process.env` — no code change required, only CDK env var update

### Root cause analysis

**Why `updates@beatsontheblockfest.com` goes to spam:**  
beatsontheblockfest.com has no SPF, DKIM, or DMARC records. When SES sends from this domain, receiving servers cannot cryptographically verify the sender, so the mail scores poorly and lands in spam.

**Why `info@beatsontheblockfest.com` doesn't send at all:**  
beatsontheblockfest.com has never been verified as an SES sending identity. SES rejects send attempts from unverified domains in production mode.

---

## Decision: SES Domain Verification via CDK EmailIdentity

**Decision**: Use `aws_ses.EmailIdentity` in `DnsStack` to verify beatsontheblockfest.com as an SES sending domain.

**Rationale**:  
- `EmailIdentity` with `hostedZone` automatically creates the 3 DKIM CNAME records in Route53 — no manual record entry needed.
- Placing it in `DnsStack` keeps all DNS-related resources together and avoids adding a new cross-stack dependency.
- CDK manages the lifecycle: if the stack is torn down, the identity is removed.
- Consistent with Constitution §VIII (no manual console changes).

**Alternatives considered**:
- *Manual SES verification in console*: Violates Constitution §VIII. Rejected.
- *EmailIdentity in BackendStack*: Would require passing `dnsStack` to `BackendStack` and adding a new cross-stack dependency. Unnecessary complexity — DnsStack already owns the hosted zone.
- *SendGrid for beatsontheblockfest.com*: SendGrid is already configured for connectevents.co for PeerPop campaigns. Replicating that for a new domain adds credential management overhead. SES is the right choice for transactional email since the Lambda already uses it.

---

## Decision: SPF Record Authorizes Both SES and Google Workspace

**Decision**: `v=spf1 include:amazonses.com include:_spf.google.com ~all`

**Rationale**:  
beatsontheblockfest.com has two legitimate sending sources:
- **AWS SES** — used by Lambda for `noreply@beatsontheblockfest.com` transactional emails
- **Google Workspace** — used by staff for `info@beatsontheblockfest.com` and `updates@beatsontheblockfest.com`

Both must be in the SPF record. The original plan had SES-only, which was incorrect — it would have fixed the Lambda emails but left `updates@` and `info@` Google Workspace sends going to spam.

---

## Decision: MX Records Point to Google Workspace

**Decision**: Add the same Google Workspace MX records used for connectevents.co.

**Rationale**:  
From the connectevents.co DnsStack, `info@connectevents.co` routes inbound mail through Google Workspace MX records. The same setup is needed for `info@beatsontheblockfest.com` to receive replies and direct messages. This assumes beatsontheblockfest.com has been added to the same Google Workspace account — a prerequisite confirmed by the fact that the inbox already partially exists (users report sending issues, not "address doesn't exist").

---

## Decision: FROM_EMAIL Stays `noreply@` — Switch Domain Only

**Decision**: Change `FROM_EMAIL` from `'noreply@connectevents.co'` to `'noreply@beatsontheblockfest.com'`.

**Rationale**:  
Using `noreply@` for Lambda/SES transactional emails is intentional — it signals to recipients that automated confirmations don't need a reply. More importantly, `noreply@` is a send-only SES address with no Google Workspace inbox, which avoids needing to set up a second mailbox. `info@beatsontheblockfest.com` is reserved for admin notifications (CONTACT_EMAIL) and staff correspondence.

---

## Decision: CORS Origins Must Include beatsontheblockfest.com

**Decision**: Add `'https://beatsontheblockfest.com'` and `'https://www.beatsontheblockfest.com'` to the CORS allowed origins in BackendStack.

**Rationale**:  
The current CORS policy only allows `connectevents.co` origins for production. Since the site now lives at beatsontheblockfest.com, the API needs to accept requests from that origin. Without this change, browser-side form submissions from beatsontheblockfest.com would be blocked by CORS.

---

## Decision: DMARC Policy Stays `p=none` (monitor-only)

**Decision**: `v=DMARC1; p=none;`

**Rationale**:  
Consistent with connectevents.co configuration. Starting with `p=none` avoids accidentally blocking legitimate mail while domain reputation is being established. This can be tightened to `p=quarantine` or `p=reject` in a future iteration after monitoring shows clean alignment.

---

## Google Workspace DKIM Record (Confirmed Available)

**Status**: Generated and ready — no prerequisites.

**DNS record to add in CDK**:
```
Record name:  google._domainkey
Record type:  TXT
Value:        v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo9MM/iEqLqpHOsayx4y1FO9QuYpNGod4AJ2s4LvvPxZ65lbY4FqCDeH2SlKQZiLFz2+S8JJbDi2eAPKzV61o99rHbK+B9ZZuK6D3MxShHJlXms8PNY2JdOfD3xbj3K4HmikoXqLlQoGDfO/ZkGeBymBZ7IuQDHCyDTk1+uAZj5ucz6zkTz0zEn5gCwN68boQ2yH0djK3yIf19hNtXFhA3g1uT8A+quJUjaoM9pGBEkOKMYaCGNpf4vsFb2gQSR51KowmkPlKQnYRJvUWOccdSZaBHRb23U+2fvHhB9lJZPvYCKAvRkP3tPqP8DfKF5HmYvIt+/PgiDdPrDXNpylTtQIDAQAB
```

This is added as a `route53.TxtRecord` in `dns-stack.ts` with `recordName: 'google._domainkey'` on the `beatsontheblockfestHostedZone`.

---

## No Lambda Code Changes Required

`formShared.ts` already reads `FROM_EMAIL` and `CONTACT_EMAIL` from `process.env`. The `sendEmail()` and `sendConfirmationEmail()` functions need no changes — they will automatically pick up the updated env vars when the Lambda is redeployed with the new CDK configuration.

---

## Deployment Order

1. Deploy `ConnectDnsStack` — creates SES EmailIdentity + DNS records (SPF, DMARC, MX, DKIM CNAMEs auto-created by CDK EmailIdentity)
2. Wait for SES to verify the domain (usually immediate once DNS propagates, ~5 minutes)
3. Deploy `ConnectStagingBackendStack` — staging env picks up new FROM_EMAIL; verify test form submission arrives from `info@beatsontheblockfest.com`
4. Deploy `ConnectBackendStack` — production env switches over
5. Verify: submit form on production site, check inbox, check spam
