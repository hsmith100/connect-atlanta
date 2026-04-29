# Research: SendGrid Email Authentication DNS Records

**Feature**: 003-sendgrid-dns-auth  
**Date**: 2026-04-29

## Finding 1: Existing DNS Stack Structure

**Decision**: Add all 4 records directly to `infrastructure/lib/stacks/dns-stack.ts` alongside the existing MX and SPF records.

**Rationale**: `dns-stack.ts` already imports `aws_route53` and holds `this.hostedZone`. Adding records here is a 1-file change with zero architectural friction.

**Alternatives considered**:
- Separate CDK stack: Unnecessary overhead for 4 static records.
- Manual console entry: Violates Principle VIII (CDK as source of truth).

---

## Finding 2: SPF Record — No Update Required

**Decision**: Leave the existing SPF record (`v=spf1 include:_spf.google.com ~all`) unchanged.

**Rationale**: SendGrid authenticates email via DKIM (the 2 CNAME records), not via SPF sender inclusion. With DKIM passing and DMARC set to `p=none` (monitor-only), SPF softfail for SendGrid's servers does not cause mail rejection. Adding SendGrid's SPF include is not required by PeerPop's instructions.

**Alternatives considered**:
- Add `include:sendgrid.net` to SPF: Not required per PeerPop instructions; would also lengthen the SPF lookup chain unnecessarily.

---

## Finding 3: No Existing `_dmarc` Record

**Decision**: Add a new `TxtRecord` at `_dmarc.connectevents.co` — no conflict resolution required.

**Rationale**: Reading the current `dns-stack.ts` confirms there is no existing `_dmarc` TXT record. The only existing TXT record is the SPF record at the zone apex.

**Alternatives considered**: N/A — no conflict found.

---

## Finding 4: CDK Construct Selection

**Decision**: Use `route53.CnameRecord` for the 3 CNAME entries and `route53.TxtRecord` for the DMARC record.

**Rationale**: These are the exact CDK L2 constructs already imported in `dns-stack.ts`. The `recordName` property targets the subdomain relative to the zone (e.g., `em335` resolves to `em335.connectevents.co`).

**Construct API**:
```typescript
new route53.CnameRecord(this, 'LogicalId', {
  zone: this.hostedZone,
  recordName: 'subdomain',
  domainName: 'target.example.com',
});

new route53.TxtRecord(this, 'LogicalId', {
  zone: this.hostedZone,
  recordName: '_dmarc',
  values: ['v=DMARC1; p=none;'],
});
```

---

## Finding 5: Deployment Scope

**Decision**: Deploy only `ConnectDnsStack` — no other stacks need updating.

**Rationale**: `ConnectDnsStack` is a standalone stack with no imports from other stacks. Adding DNS records has no cross-stack dependency effects. Staging and dev stacks are unaffected (they have no hosted zone).

**Deployment command**: `npx cdk deploy ConnectDnsStack --require-approval never` (CI) or `npx cdk deploy ConnectDnsStack` (manual, review changeset first per Principle VIII).
