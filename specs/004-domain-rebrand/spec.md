# Feature Specification: Domain Rebrand — connectevents.co → beatsontheblockfest.com

**Feature Branch**: `004-domain-rebrand`
**Created**: 2026-05-04
**Status**: Draft
**Input**: User description: "we are swapping domains from connectevents.co to beatsontheblockfest.com, this will be the new domain for the site. We own both so I would like connectevents.co to redirect to beatsontheblockfest.com as well while we go through the rebrand"

## Clarifications

### Session 2026-05-04

- Q: What email service currently receives incoming mail at @connectevents.co? → A: Google Workspace (Gmail for the domain); domain is registered at Namecheap but DNS is already managed in Route53.
- Q: Should the spec require a mandatory pre-change snapshot of all connectevents.co email DNS records as a formal acceptance gate? → A: No — FR-005 is sufficient; trust the process.
- Q: Should the spec require that changes to connectevents.co DNS only ever add new records — never remove or modify existing ones? → A: Yes — existing connectevents.co DNS records are immutable for this feature; only new records or infrastructure may be added.
- Q: Should the spec include an explicit send-and-receive test to info@connectevents.co as a required acceptance scenario? → A: Yes — tested manually; send a test email to info@connectevents.co after the change is live and confirm receipt in Google Workspace.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Site Accessible at New Domain (Priority: P1)

A visitor types beatsontheblockfest.com into their browser and reaches the Beats on the Block site. The site loads fully and all features work correctly under the new domain — events, gallery, forms, and admin panel.

**Why this priority**: This is the primary goal of the rebrand. Until beatsontheblockfest.com serves the live site, the domain swap cannot proceed.

**Independent Test**: Open beatsontheblockfest.com and www.beatsontheblockfest.com in a browser. Both load the full site over HTTPS with no security warnings.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to `beatsontheblockfest.com`, **When** the page loads, **Then** the full site is displayed over a secure HTTPS connection with no certificate errors
2. **Given** a visitor navigates to `www.beatsontheblockfest.com`, **When** the page loads, **Then** the full site loads (or a consistent redirect to the apex domain occurs)
3. **Given** a visitor navigates to a specific page (e.g., `/join`), **When** the URL uses the new domain, **Then** the correct page loads without errors

---

### User Story 2 - Old Domain Redirects to New Domain (Priority: P2)

A visitor, past attendee, or search engine bot follows an existing link to connectevents.co. Instead of hitting a dead end or stale page, they are automatically redirected to the equivalent page on beatsontheblockfest.com. The redirect preserves the URL path (e.g., connectevents.co/join → beatsontheblockfest.com/join).

**Why this priority**: connectevents.co links exist in social media posts, email campaigns, search engine indexes, and attendee bookmarks. A permanent redirect preserves all of this equity and ensures no user is left behind during the rebrand period.

**Independent Test**: Navigate to connectevents.co and connectevents.co/join in a browser. Both should land on the correct beatsontheblockfest.com pages. Inspect the HTTP response to confirm it is a permanent (301) redirect.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to `connectevents.co`, **When** the page loads, **Then** the browser is permanently redirected to `beatsontheblockfest.com`
2. **Given** a visitor navigates to `connectevents.co/join`, **When** the page loads, **Then** the browser is permanently redirected to `beatsontheblockfest.com/join` (path preserved)
3. **Given** a visitor navigates to `www.connectevents.co`, **When** the page loads, **Then** the browser is permanently redirected to `beatsontheblockfest.com`
4. **Given** a search engine bot follows an indexed connectevents.co URL, **When** it receives the redirect response, **Then** it receives a 301 (permanent) status code signalling the new canonical location

---

### User Story 3 - HTTPS Secure on New Domain (Priority: P2)

A visitor reaches the site at beatsontheblockfest.com and their browser shows a secure padlock with no warnings. The SSL/TLS certificate covers both the apex domain and the www subdomain.

**Why this priority**: A missing or invalid certificate on the new domain would cause browsers to warn visitors away from the site, undermining the launch.

**Independent Test**: Verify beatsontheblockfest.com and www.beatsontheblockfest.com in a browser and in an online SSL checker — both should show a valid certificate with no errors.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to `https://beatsontheblockfest.com`, **When** the page loads, **Then** the browser displays a valid security certificate with no warnings
2. **Given** a visitor navigates to `http://beatsontheblockfest.com`, **When** the page loads, **Then** they are automatically redirected to the HTTPS version

---

### Edge Cases

- What if a visitor bookmarked a deep link on connectevents.co (e.g., a specific event page)? — The redirect must preserve the full path so the bookmark continues to work.
- What if search engines have already indexed connectevents.co pages? — A 301 redirect passes link equity and signals to crawlers to update their index; no manual action is required per page.
- What if the new domain certificate is not yet issued when DNS is changed? — There will be a brief window where the site is unreachable over HTTPS; the certificate must be provisioned and validated before the DNS cutover.
- What if email delivery for connectevents.co is disrupted by the change? — The web redirect must not touch email DNS records on connectevents.co. Because connectevents.co DNS is already on Route53 (no nameserver change required), the risk is lower than prior migrations — but all Google Workspace MX records, SPF, DKIM, DMARC, and SendGrid CNAMEs must be explicitly audited before changes begin and verified unchanged after.
- What if a visitor bookmarked the www subdomain of either domain? — Both www variants must redirect correctly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The beatsontheblockfest.com domain (apex and www) MUST serve the full site over HTTPS
- **FR-002**: The SSL/TLS certificate for beatsontheblockfest.com MUST cover both the apex domain and the www subdomain
- **FR-003**: Any HTTP request to beatsontheblockfest.com MUST be automatically redirected to the HTTPS equivalent
- **FR-004**: All HTTP and HTTPS requests to connectevents.co (apex and www) MUST be permanently redirected (301) to the equivalent URL on beatsontheblockfest.com, preserving path and query string
- **FR-005**: The Google Workspace MX records and all email authentication DNS records on connectevents.co (SPF, DKIM, DMARC, and SendGrid authentication CNAMEs) MUST remain unchanged so that Google Workspace email delivery and transactional email continue to function without interruption
- **FR-006**: The new domain configuration MUST be managed in the same infrastructure-as-code system as all other DNS and hosting configuration, so it is version-controlled and reproducible
- **FR-007**: All changes to connectevents.co DNS MUST be additive only — no existing DNS records on connectevents.co may be removed or modified as part of this feature; the connectevents.co nameservers MUST continue pointing to the current DNS provider unchanged

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: beatsontheblockfest.com loads the full site with the same performance as the previous domain — no degradation in page load time
- **SC-002**: 100% of connectevents.co URLs (tested across apex, www, and representative deep paths) return a 301 redirect pointing to the correct beatsontheblockfest.com URL
- **SC-003**: A valid HTTPS certificate is live on beatsontheblockfest.com before any DNS cutover — zero HTTPS downtime for visitors during the transition
- **SC-004**: After the domain change is live, a manually sent test email to info@connectevents.co is received successfully in Google Workspace — confirming that Google Workspace MX routing and all email authentication records remain intact; transactional notification emails continue to deliver without error
- **SC-005**: Search engine crawlers begin indexing beatsontheblockfest.com as the canonical domain within the standard re-crawl window (typically 2–4 weeks), with connectevents.co URLs no longer appearing as primary results

## Assumptions

- Both beatsontheblockfest.com and connectevents.co are registered at Namecheap; connectevents.co DNS is already managed in Route53 (no nameserver change required for it); beatsontheblockfest.com will require its nameservers to be updated at Namecheap to point to Route53 as part of this feature
- beatsontheblockfest.com has not yet been configured to serve web traffic in the current infrastructure — provisioning it is in scope for this feature
- Email addresses (@connectevents.co) will continue to be used during the rebrand period and are not changing as part of this feature
- PeerPop/SendGrid email campaigns will continue to send from the connectevents.co sender domain for now — re-authenticating under beatsontheblockfest.com is explicitly out of scope
- The redirect from connectevents.co to beatsontheblockfest.com is permanent (301) for SEO purposes — a temporary redirect is not appropriate
- The www subdomain for beatsontheblockfest.com should behave consistently with the apex (either serve directly or redirect to apex, matching current connectevents.co behaviour)
- The Google Analytics property currently tracking connectevents.co will need to be updated to track the new domain — this is noted but may be addressed as a follow-on task
