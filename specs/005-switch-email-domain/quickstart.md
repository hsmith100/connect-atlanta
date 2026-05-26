# Quickstart: Switch Email Domain to beatsontheblockfest.com

## What This Feature Changes

| File | Change |
|------|--------|
| `infrastructure/lib/stacks/dns-stack.ts` | Add SES EmailIdentity + SPF + DMARC + MX for beatsontheblockfest.com |
| `infrastructure/lib/stacks/backend-stack.ts` | Update FROM_EMAIL, contactEmail default, CORS origins |

No Lambda handler code changes. No frontend changes. No new DynamoDB tables.

## Prerequisites

- AWS CLI configured for account `145185391901`, region `us-east-1`
- beatsontheblockfest.com is already in Route53 (DnsStack) and Namecheap nameservers point to Route53
- beatsontheblockfest.com Google Workspace is provisioned (so the `info@` inbox can receive mail)
- `cd infrastructure && npm install` if dependencies are stale

## Deploy Steps

### Step 1 — Deploy DnsStack (adds SES identity + email DNS records)

```bash
cd infrastructure
npx cdk deploy ConnectDnsStack --require-approval always
```

Review the changeset before approving. Expected additions:
- `BeatsSesDomainIdentity` — SES EmailIdentity for beatsontheblockfest.com
- 3× DKIM CNAME records (auto-created by CDK EmailIdentity)
- `BeatsMxRecord` — Google Workspace MX records
- `BeatsSpfRecord` — SPF TXT record
- `BeatsDmarcRecord` — DMARC TXT record

### Step 2 — Verify SES domain status

```bash
aws ses get-identity-verification-attributes \
  --identities beatsontheblockfest.com \
  --region us-east-1
```

Expected: `"VerificationStatus": "Success"`. If `Pending`, wait 5 minutes and retry — DNS propagation takes a moment.

### Step 3 — Deploy staging backend

```bash
npx cdk deploy ConnectStagingBackendStack --require-approval always
```

### Step 4 — Test on staging

Submit the contact form on the staging site (`https://d36pa7dr4nksf5.cloudfront.net`). Verify:
- Confirmation email arrives from `info@beatsontheblockfest.com` (not `noreply@connectevents.co`)
- Email lands in primary inbox, not spam
- Admin notification lands in `productions.connectatlanta@gmail.com` (staging CONTACT_EMAIL)

### Step 5 — Deploy production backend

```bash
npx cdk deploy ConnectBackendStack --require-approval always
```

### Step 6 — Verify production

Submit the contact form on the live site. Verify:
- Confirmation email arrives from `info@beatsontheblockfest.com`
- Email is in inbox, not spam
- Admin notification arrives at `info@beatsontheblockfest.com`

## Rollback

If emails stop working after deployment, roll back by reverting the `FROM_EMAIL` and `contactEmail` changes in `backend-stack.ts` and redeploying. The DNS records can remain — they don't break anything.

## Troubleshooting

| Symptom | Likely Cause | Check |
|---------|-------------|-------|
| SES still rejects sends | Domain not yet verified | Run Step 2 verification check |
| Emails still go to spam | DNS not propagated yet | Wait 10–15 min; check SPF/DKIM via `dig TXT beatsontheblockfest.com` |
| CORS error on form submit | CORS origins not updated | Confirm backend-stack.ts change is deployed |
| `info@` inbox not receiving | Google Workspace not configured for beatsontheblockfest.com | Add domain to Google Workspace admin console |
