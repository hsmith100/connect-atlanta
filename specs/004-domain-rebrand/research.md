# Research: Domain Rebrand — connectevents.co → beatsontheblockfest.com

**Branch**: `004-domain-rebrand` | **Date**: 2026-05-04

## Decision 1: Redirect implementation strategy for connectevents.co

**Decision**: CloudFront Function on the existing connectevents.co distribution that issues a permanent 301 redirect to beatsontheblockfest.com, preserving path and query string.

**Rationale**: This approach requires zero DNS changes to connectevents.co — the existing Route53 A records continue pointing to the same CloudFront distribution, satisfying FR-007 (additive-only). The CloudFront Function runs at edge before the origin is consulted, so the S3 origin is never hit; the redirect is sub-millisecond. No S3 redirect buckets, Lambda@Edge, or new infrastructure types are required.

**Alternatives considered**:
- S3 website redirect bucket + new CloudFront distribution: requires changing connectevents.co A records to point to the new distribution (violates FR-007) or keeping the existing distribution with a new S3 redirect origin (more moving parts, no benefit over a CloudFront Function).
- Lambda@Edge redirect: heavier runtime, higher latency (regional Lambda invocation vs edge-local Function), not justified for a simple domain redirect.
- Modifying connectevents.co A records to point to a dedicated redirect distribution: directly violates FR-007.

---

## Decision 2: Where beatsontheblockfest.com lives — new distribution vs. adding to existing

**Decision**: Create a new, separate CloudFront distribution for beatsontheblockfest.com pointing to the same S3 bucket and API origin as the existing distribution.

**Rationale**: The existing distribution will have its CloudFront Function replaced with a pure redirect function (all traffic sent to beatsontheblockfest.com). The new distribution needs the URL-rewrite function and the `/api/*` origin behaviour. Using a separate distribution keeps their configurations independent and avoids a redirect loop (a single distribution serving both domains with a domain-aware function is fragile and harder to reason about).

**Alternatives considered**:
- Single distribution with a domain-aware CloudFront Function: the Function would check the `Host` header and either redirect (for connectevents.co) or rewrite (for beatsontheblockfest.com). Technically feasible but mixes two responsibilities into one function and creates a tight coupling between the two domains' configurations.

---

## Decision 3: ACM certificate for beatsontheblockfest.com

**Decision**: A separate ACM certificate covering `beatsontheblockfest.com` and `www.beatsontheblockfest.com`, created in the existing DnsStack with `CertificateValidation.fromDns` against the new hosted zone.

**Rationale**: ACM does not support adding SANs to an existing certificate — a new certificate is always required. Keeping it as a separate cert (rather than replacing the existing connectevents.co cert with a combined 4-domain cert) means the existing cert and distribution are untouched during the transition. The existing cert remains valid and in use on the existing distribution; the new cert is only used by the new beatsontheblockfest.com distribution.

**Alternatives considered**:
- Combined 4-domain cert (connectevents.co + www + beatsontheblockfest.com + www): would require replacing the cert on the existing distribution, creating a deployment dependency where both the cert and distribution must update atomically. More complex, no benefit.

---

## Decision 4: CDK structure — where to put beatsontheblockfest.com zone and cert

**Decision**: Add `beatsontheblockfestHostedZone` and `beatsontheblockfestCertificate` as new public properties on the existing `DnsStack` class. The existing `FrontendStack` receives the same `dnsStack` reference and reads these new properties when `isProd` is true.

**Rationale**: Mirrors the existing pattern exactly (the connectevents.co hosted zone and cert are already on DnsStack and consumed by FrontendStack). No new stack classes needed. `FrontendStack` props interface is unchanged — `dnsStack?: DnsStack` still covers both domains.

**Alternatives considered**:
- Separate `RebrandDnsStack`: unnecessary extra stack for two resource additions; CDK cross-stack export overhead with no benefit.
- Inlining zone and cert in FrontendStack: DNS resources belong in DnsStack by existing convention; mixing them would break the stack responsibility model.

---

## Decision 5: OAI (Origin Access Identity) for the new distribution

**Decision**: Reuse the existing OAI from the current distribution for the new beatsontheblockfest.com distribution. A single OAI can be associated with multiple CloudFront distributions against the same S3 bucket — no additional `grantRead` call or separate OAI is needed.

**Rationale**: AWS supports multiple distributions accessing the same S3 bucket through the same OAI. Reusing it keeps the CDK construct count minimal and avoids an additional bucket policy statement.

**Alternatives considered**:
- Separate OAI per distribution: unnecessary; no security or operational benefit for the same bucket.

---

## Decision 6: www.beatsontheblockfest.com behaviour

**Decision**: `www.beatsontheblockfest.com` is an additional alias on the new beatsontheblockfest.com distribution (same content, no separate redirect). The cert covers both. Route53 A + AAAA alias records are created for both apex and www.

**Rationale**: Matches the existing behaviour for connectevents.co (www and apex both serve content on the same distribution). Keeps the configuration symmetric and avoids an additional redirect hop for www visitors.

---

## Decision 7: Deployment sequencing (cert validation dependency)

**Decision**: Two-phase deployment with a manual Namecheap nameserver update between phases.

**Phase A — DnsStack**:
- Creates beatsontheblockfest.com hosted zone (synchronous, nameservers available immediately in CloudFormation output)
- Starts ACM cert creation; CDK inserts DNS validation CNAME into the new hosted zone automatically
- CDK blocks waiting for cert validation
- User must update Namecheap nameservers for beatsontheblockfest.com to Route53 NS values while CDK is waiting
- Cert validates within ~5 minutes of NS propagation; CDK deploy completes

**Phase B — FrontendStack** (after Phase A completes):
- Creates new beatsontheblockfest.com distribution
- Replaces connectevents.co distribution's CloudFront Function with the redirect function
- Creates Route53 A + AAAA alias records for beatsontheblockfest.com in the new hosted zone

**Rationale**: The cert must be fully validated and in DnsStack outputs before FrontendStack can reference it. Phase B cannot run until Phase A completes. See quickstart.md for exact commands and timing.

---

## CloudFront Function: redirect implementation

The connectevents.co distribution's existing URL-rewrite function is **replaced** with a redirect function. Since 100% of requests to the existing distribution are being redirected, the rewrite logic is no longer needed on that distribution.

```javascript
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var qs = request.querystring;
  var queryString = '';

  if (qs) {
    var parts = [];
    var keys = Object.keys(qs);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var param = qs[key];
      if (param.multiValue) {
        for (var j = 0; j < param.multiValue.length; j++) {
          parts.push(key + '=' + param.multiValue[j].value);
        }
      } else {
        parts.push(key + '=' + param.value);
      }
    }
    if (parts.length > 0) queryString = '?' + parts.join('&');
  }

  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: {
      location: { value: 'https://beatsontheblockfest.com' + uri + queryString }
    }
  };
}
```

**Notes**:
- This function runs in the `JS_2_0` CloudFront Functions runtime (same as the existing rewrite function).
- `event.request.querystring` is CloudFront's parsed query-string object (not a raw string); the loop above reconstructs the raw string correctly.
- The function short-circuits before CloudFront checks the cache or contacts the origin, so the S3 and API Gateway origins on the existing distribution are never hit after this change.

---

## Affected CDK files

| File | Change type |
|------|-------------|
| `infrastructure/lib/stacks/dns-stack.ts` | Add beatsontheblockfest.com hosted zone + ACM cert + nameserver output |
| `infrastructure/lib/stacks/frontend-stack.ts` | Add redirect function, new distribution, Route53 records for new domain |
| `infrastructure/bin/app.ts` | No changes required |

No Lambda, frontend, or DynamoDB code changes. No new CDK stacks.
