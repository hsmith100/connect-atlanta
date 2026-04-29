# Quickstart: SendGrid Email Authentication DNS Records

**Feature**: 003-sendgrid-dns-auth

## What This Does

Adds 4 DNS records to the Route53 hosted zone for `connectevents.co` so that PeerPop email marketing campaigns pass DKIM/DMARC authentication and land in recipients' inboxes instead of spam.

## Implementation (Single File)

Edit `infrastructure/lib/stacks/dns-stack.ts` — add the following block after the existing SPF record:

```typescript
// SendGrid email authentication — DKIM keys and email link tracking subdomain
// Required by PeerPop to send authenticated marketing campaigns from connectevents.co
new route53.CnameRecord(this, 'SendGridEmailTracking', {
  zone: this.hostedZone,
  recordName: 'em335',
  domainName: 'u40615086.wl087.sendgrid.net',
});

new route53.CnameRecord(this, 'SendGridDkimKey1', {
  zone: this.hostedZone,
  recordName: 's1._domainkey',
  domainName: 's1.domainkey.u40615086.wl087.sendgrid.net',
});

new route53.CnameRecord(this, 'SendGridDkimKey2', {
  zone: this.hostedZone,
  recordName: 's2._domainkey',
  domainName: 's2.domainkey.u40615086.wl087.sendgrid.net',
});

// DMARC monitoring policy — p=none means monitor only, no mail is blocked
new route53.TxtRecord(this, 'DmarcRecord', {
  zone: this.hostedZone,
  recordName: '_dmarc',
  values: ['v=DMARC1; p=none;'],
});
```

## Deploy

```bash
cd infrastructure
npx cdk deploy ConnectDnsStack
```

Review the changeset — you should see exactly 4 new Route53 record resources. Approve to deploy.

## Verify

**DNS lookup** (resolves within minutes, full propagation up to 48h):
```bash
dig CNAME em335.connectevents.co
dig CNAME s1._domainkey.connectevents.co
dig CNAME s2._domainkey.connectevents.co
dig TXT _dmarc.connectevents.co
```

**Or use MXToolbox**: https://mxtoolbox.com/SuperTool.aspx — check each record resolves correctly.

**PeerPop verification**: Log in to PeerPop → domain settings → click "Verify" next to connectevents.co. Once all records resolve, PeerPop will show the domain as authenticated.

## Test

Send a test campaign from PeerPop to a personal Gmail or Outlook address. Confirm it lands in the primary inbox with no spam warnings.

## Notes

- Only `ConnectDnsStack` is deployed — no Lambda, frontend, or DynamoDB changes
- Staging and dev environments are unaffected (they have no Route53 hosted zone)
- The DMARC policy starts at `p=none` (monitor only) — no mail is blocked by this change
- SES transactional emails (form notifications to info@connectevents.co) are unaffected
