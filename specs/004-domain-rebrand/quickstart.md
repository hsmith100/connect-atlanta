# Quickstart: Domain Rebrand — connectevents.co → beatsontheblockfest.com

**Branch**: `004-domain-rebrand` | **Date**: 2026-05-04

## Overview

This feature requires two CDK stacks to be deployed in sequence, with a manual Namecheap nameserver update in between. The ACM certificate for beatsontheblockfest.com cannot validate until its nameservers point to Route53.

**No Lambda, frontend build, or DynamoDB changes.** Only `ConnectDnsStack` and `ConnectFrontendStack` are affected.

### Relationship to the PR pipeline

The PR CI pipeline only deploys `ConnectPR${PR_NUMBER}*` ephemeral stacks — `ConnectDnsStack` is never touched by CI and is always deployed manually. The ephemeral FrontendStack has no `dnsStack` prop, so the new beatsontheblockfest.com distribution and redirect function are completely inert in PR environments.

However, FrontendStack has a cross-stack reference to `dnsStack.beatsontheblockfestCertificate`. The production pipeline (triggered on merge to main) deploys `ConnectFrontendStack` and will fail if `ConnectDnsStack` hasn't been deployed yet.

**Safe sequence**: Deploy `ConnectDnsStack` + Namecheap update **before opening the PR** → cert validates → open PR → ephemeral deploy succeeds → merge PR → production pipeline deploys FrontendStack ✅

The DnsStack changes are purely additive (new zone + new cert only). The live site has zero downtime. The cert just sits there validated and ready until the FrontendStack PR is merged.

---

## Pre-flight: Verify connectevents.co email is working

Before touching anything, confirm the current state is healthy. Send a test email to info@connectevents.co and verify receipt in Google Workspace. This establishes a known-good baseline.

---

## Phase A: DnsStack — new hosted zone + certificate

### 1. Deploy ConnectDnsStack

```bash
cd infrastructure
npx cdk deploy ConnectDnsStack --require-approval never
```

CDK will:
1. Create the `beatsontheblockfest.com` hosted zone immediately (fast)
2. Start the ACM certificate request and auto-add the DNS validation CNAME to the new hosted zone
3. **Block** waiting for cert validation — this is expected

### 2. Get beatsontheblockfest.com nameservers (while CDK is waiting)

In a second terminal:

```bash
aws route53 list-hosted-zones-by-name \
  --dns-name beatsontheblockfest.com \
  --query 'HostedZones[0].Id' \
  --output text | xargs -I{} aws route53 get-hosted-zone \
  --id {} \
  --query 'DelegationSet.NameServers'
```

Or get them from the CloudFormation console under `ConnectDnsStack` → Outputs → `BeatsNameServers`.

You will see four nameservers like:
```
ns-XXXX.awsdns-XX.org
ns-XXXX.awsdns-XX.net
ns-XXXX.awsdns-XX.com
ns-XXXX.awsdns-XX.co.uk
```

### 3. Update Namecheap nameservers for beatsontheblockfest.com

1. Log into Namecheap → Domain List → `beatsontheblockfest.com` → Manage
2. Under **Nameservers**, switch from "Namecheap BasicDNS" (or current setting) to **Custom DNS**
3. Enter all four Route53 nameservers from step 2
4. Save

DNS propagation typically takes 5–30 minutes. The ACM validation CNAME is already in Route53, so the cert will validate as soon as Route53 becomes authoritative for the domain.

### 4. Wait for CDK to complete

The CDK deploy from step 1 will detect the cert validation and finish. This usually takes 5–10 minutes after the NS change propagates.

**Do not proceed to Phase B until Phase A completes successfully.**

---

## Phase B: FrontendStack — new distribution + redirect

### 5. Deploy ConnectFrontendStack

```bash
npx cdk deploy ConnectFrontendStack --require-approval never
```

This will:
- Create the new beatsontheblockfest.com CloudFront distribution (serving the same S3 content)
- Replace the connectevents.co distribution's URL-rewrite CloudFront Function with a 301 redirect function
- Add Route53 A + AAAA alias records for beatsontheblockfest.com and www.beatsontheblockfest.com

### 6. Note the new distribution URL

From the CDK output or CloudFormation:
- `BeatsCloudFrontUrl`: the CloudFront URL for the new beatsontheblockfest.com distribution

---

## Acceptance Testing

Run all tests before declaring the feature complete.

### Test 1 — New domain serves the site

```bash
# Apex domain
curl -I https://beatsontheblockfest.com
# Expected: HTTP 200, no certificate errors

# www subdomain
curl -I https://www.beatsontheblockfest.com
# Expected: HTTP 200 (or 301 to apex — either is acceptable)

# Deep path
curl -I https://beatsontheblockfest.com/join
# Expected: HTTP 200
```

Or open in browser — confirm the full site loads, gallery works, forms work, admin panel accessible.

### Test 2 — connectevents.co redirects permanently

```bash
# Apex
curl -I https://connectevents.co
# Expected: HTTP 301, Location: https://beatsontheblockfest.com/

# www
curl -I https://www.connectevents.co
# Expected: HTTP 301, Location: https://beatsontheblockfest.com/

# Path preserved
curl -I https://connectevents.co/join
# Expected: HTTP 301, Location: https://beatsontheblockfest.com/join

# Query string preserved
curl -I "https://connectevents.co/events?id=abc"
# Expected: HTTP 301, Location: https://beatsontheblockfest.com/events?id=abc
```

### Test 3 — HTTPS valid on new domain

```bash
curl -vI https://beatsontheblockfest.com 2>&1 | grep -E "(SSL|TLS|certificate|subject|issuer)"
# Expected: valid certificate, no errors
```

Or use https://www.ssllabs.com/ssltest/ for a full report.

### Test 4 — Email delivery unaffected (SC-004 acceptance gate)

Send a test email to `info@connectevents.co` from an external address (Gmail, Outlook, etc.) and confirm it arrives in Google Workspace. This must pass before the feature is considered complete.

Check MX records are intact:
```bash
dig MX connectevents.co +short
# Expected: Google Workspace MX records (aspmx.l.google.com etc.)
```

### Test 5 — connectevents.co email DNS unchanged

```bash
# SPF
dig TXT connectevents.co +short | grep spf
# Expected: v=spf1 include:_spf.google.com ~all

# DMARC
dig TXT _dmarc.connectevents.co +short
# Expected: v=DMARC1; p=none;

# SendGrid DKIM
dig CNAME s1._domainkey.connectevents.co +short
# Expected: s1.domainkey.u40615086.wl087.sendgrid.net
```

---

## Rollback

If anything goes wrong:

**Rollback FrontendStack only** (restores connectevents.co site, removes redirect + new distribution):
```bash
git revert HEAD  # revert FrontendStack changes
npx cdk deploy ConnectFrontendStack --require-approval never
```

**Rollback DnsStack** (removes beatsontheblockfest.com zone + cert — only if FrontendStack already rolled back):
```bash
git revert HEAD  # revert DnsStack changes
npx cdk deploy ConnectDnsStack --require-approval never
# Then revert Namecheap nameservers for beatsontheblockfest.com
```

connectevents.co DNS is **never modified** by this feature, so email is unaffected by any rollback path.

---

## Post-deployment

- [ ] Confirm all 5 acceptance tests pass
- [ ] Update Google Analytics property to track beatsontheblockfest.com (follow-on task — see spec Assumptions)
- [ ] Notify team that beatsontheblockfest.com is live
