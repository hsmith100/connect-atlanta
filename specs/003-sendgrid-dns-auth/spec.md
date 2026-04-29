# Feature Specification: SendGrid Email Authentication for connectevents.co

**Feature Branch**: `003-sendgrid-dns-auth`  
**Created**: 2026-04-29  
**Status**: Draft  
**Input**: User description: "Add SendGrid email authentication DNS records to AWS Route53 for connectevents.co to fix email marketing campaigns going to spam via PeerPop"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marketing Emails Land in Inbox (Priority: P1)

The Connect Atlanta team sends an email marketing campaign through PeerPop to subscribers. Today those emails are flagged as spam by recipients' email providers because connectevents.co has no email authentication records. After this change, the domain is authenticated with SendGrid and campaigns arrive in recipients' inboxes.

**Why this priority**: Email marketing is a core outreach channel. Campaigns landing in spam means zero engagement — this directly impacts event attendance and community growth.

**Independent Test**: Send a PeerPop campaign email to a Gmail or Outlook test inbox and verify it lands in the primary inbox, not spam or promotions.

**Acceptance Scenarios**:

1. **Given** a marketing campaign is sent from PeerPop using the connectevents.co sender domain, **When** the email is delivered to a Gmail recipient, **Then** it lands in the inbox (not spam) and shows no authentication warnings
2. **Given** a marketing campaign is sent from PeerPop, **When** the email headers are inspected, **Then** DKIM signature passes and SPF alignment is satisfied
3. **Given** the DMARC policy is in place, **When** an unauthorized sender attempts to spoof connectevents.co, **Then** the spoofed email fails authentication checks

---

### User Story 2 - Domain Reputation Monitoring via DMARC (Priority: P2)

With a DMARC record in place (policy: none/monitor), email providers send aggregate reports about who is sending mail as connectevents.co. The team gains visibility into their domain's sending reputation without immediately blocking legitimate mail.

**Why this priority**: Monitoring mode (p=none) is the safe starting point — it collects data without risking legitimate email delivery. Once the team has confidence in the results, the policy can be tightened.

**Independent Test**: Can be verified independently by confirming the DMARC TXT record resolves correctly at `_dmarc.connectevents.co` using a DNS lookup tool.

**Acceptance Scenarios**:

1. **Given** the DMARC record is live, **When** a DNS lookup is performed for `_dmarc.connectevents.co`, **Then** the record returns `v=DMARC1; p=none;`
2. **Given** DMARC monitoring is active, **When** email providers process mail from connectevents.co, **Then** they can enforce and report against the DMARC policy

---

### Edge Cases

- What if the domain already has a `_dmarc` TXT record from a previous setup? — The existing record must be removed or merged before adding the new one to avoid conflicts.
- What if one of the CNAME records is entered incorrectly (typo in target)? — The DKIM signature will fail for that key; PeerPop should surface a "domain not verified" warning.
- What if DNS propagation is delayed? — PeerPop may show the domain as unverified for up to 48 hours; campaigns should not be sent until PeerPop confirms authentication is active.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The connectevents.co DNS configuration MUST include a CNAME record that maps the SendGrid subdomain (`em335`) to SendGrid's email link tracking domain
- **FR-002**: The connectevents.co DNS configuration MUST include two DKIM CNAME records (`s1._domainkey` and `s2._domainkey`) that point to SendGrid's DKIM signing infrastructure, enabling cryptographic email authentication
- **FR-003**: The connectevents.co DNS configuration MUST include a DMARC TXT record at `_dmarc.connectevents.co` with a monitoring policy (`p=none`) to establish domain-level email policy
- **FR-004**: All four DNS records MUST be managed within the same infrastructure-as-code system that controls all other connectevents.co DNS records (AWS Route53), so they are version-controlled and reproducible
- **FR-005**: After the records are live, PeerPop MUST confirm that domain authentication is verified before email campaigns are sent

### Key Entities

- **DNS Record (CNAME)**: Maps a subdomain within connectevents.co to an external target managed by SendGrid; used for email link tracking and DKIM key lookup
- **DNS Record (TXT / DMARC)**: A policy record at `_dmarc.connectevents.co` that declares how email receivers should handle mail that fails authentication for connectevents.co
- **Route53 Hosted Zone**: The authoritative DNS zone for connectevents.co, already managed in AWS and the only place where DNS changes take effect (Namecheap is set to custom DNS pointing here)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: PeerPop's domain authentication dashboard shows connectevents.co as "verified" within 48 hours of the DNS records going live
- **SC-002**: A test marketing campaign sent after verification lands in the Gmail/Outlook primary inbox (not spam) for at least 9 out of 10 test sends
- **SC-003**: All four DNS records resolve correctly when looked up via a public DNS tool (e.g., MXToolbox) with zero propagation errors
- **SC-004**: No existing email flows (transactional notification emails to info@connectevents.co) are disrupted by the new records

## Assumptions

- The connectevents.co Route53 hosted zone does not currently have a `_dmarc` TXT record; if one exists it will need to be reviewed before adding
- PeerPop uses SendGrid as its underlying email delivery infrastructure; the record values provided by the partner are correct and current
- The initial DMARC policy of `p=none` (monitor only) is intentional — this is standard practice for first deployment and does not block any mail
- Transactional mail sent via SES (form notification emails to info@connectevents.co) uses SES-managed authentication and is unaffected by these SendGrid-specific records
