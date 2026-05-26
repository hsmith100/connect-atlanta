# Feature Specification: Switch Email Domain to beatsontheblockfest.com

**Feature Branch**: `005-switch-email-domain`  
**Created**: 2026-05-26  
**Status**: Draft  
**Input**: Following domain rebrand to beatsontheblockfest.com, transactional emails must switch sender domain. Reported issues: updates@beatsontheblockfest.com sends but lands in spam; info@beatsontheblockfest.com (Google Workspace inbox, confirmed exists) is not sending or receiving — root cause is missing DNS records for the domain.

## Background

The platform rebranded from connectevents.co to beatsontheblockfest.com. Transactional emails (form confirmations, admin notifications) still use the old domain and need to migrate to `info@beatsontheblockfest.com`.

Two distinct email problems have been reported on the new domain — both caused by missing DNS records:

- **`updates@beatsontheblockfest.com`** (Google Workspace): Sends successfully but lands in recipients' spam. The domain has no SPF, DKIM, or DMARC records, so receiving mail servers cannot verify the sender.
- **`info@beatsontheblockfest.com`** (Google Workspace, inbox confirmed): Neither sending nor receiving. Missing MX records mean inbound mail can't route to Google Workspace; missing SPF/DKIM mean outbound mail is rejected or flagged.

There are two email senders in play for this domain:
- **Google Workspace** — used for `info@` and `updates@` (staff email, replies)
- **AWS SES via Lambda** — used for automated transactional emails (form confirmations, admin notifications). These will send from `noreply@beatsontheblockfest.com`.

This feature covers three concerns:

1. **DNS authentication fix**: Add SPF (covering both Google Workspace and SES), DKIM records (for both senders), DMARC, and MX records for beatsontheblockfest.com so all email works correctly.
2. **Transactional sender migration**: Update automated form emails to send from `noreply@beatsontheblockfest.com` instead of `noreply@connectevents.co`.
3. **Admin notification routing**: Confirm admin form notifications are delivered to and receivable at `info@beatsontheblockfest.com`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Form Submitters Receive Branded Confirmation Emails (Priority: P1)

When a visitor submits any public form — DJ application, sponsor inquiry, newsletter signup, or contact form — they receive an automated confirmation email. That email should come from `noreply@beatsontheblockfest.com` (a send-only SES address, no inbox needed), replacing the old `noreply@connectevents.co` address, so it matches the rebranded domain.

**Why this priority**: This is customer-facing and affects trust. Receiving mail from a connectevents.co address after submitting a Beats on the Block form is confusing and erodes confidence.

**Independent Test**: Submit any public form on the site and verify the confirmation email arrives from `noreply@beatsontheblockfest.com` in the submitter's inbox.

**Acceptance Scenarios**:

1. **Given** a visitor submits a DJ application, **When** the submission is processed, **Then** the confirmation email is sent from `noreply@beatsontheblockfest.com` with no references to connectevents.co in the sender address or display name.
2. **Given** a visitor submits the contact form, **When** the submission is processed, **Then** the visitor's confirmation email originates from `noreply@beatsontheblockfest.com` and the internal admin notification is delivered to `info@beatsontheblockfest.com`.
3. **Given** a visitor signs up for the newsletter, **When** the signup is processed, **Then** the welcome/confirmation email is sent from `noreply@beatsontheblockfest.com`.
4. **Given** a sponsor submits an inquiry, **When** the submission is processed, **Then** the confirmation email is sent from `noreply@beatsontheblockfest.com`.

---

### User Story 2 - Outbound Emails Land in Inbox, Not Spam (Priority: P2)

Emails sent from `updates@beatsontheblockfest.com` are currently reaching recipients but landing in their spam folders. This means recipients are missing event updates and communications. The domain needs proper sender authentication so that mail providers recognize beatsontheblockfest.com as a trusted sender — which will also prevent the same problem from affecting `info@` once it is activated.

**Why this priority**: An email in the spam folder is functionally the same as no email. Recipients who don't see the message miss event information, and the sender appears untrustworthy.

**Independent Test**: Send a test email from `updates@beatsontheblockfest.com` to a Gmail and Outlook account and confirm it arrives in the primary inbox with no spam or security warnings.

**Acceptance Scenarios**:

1. **Given** beatsontheblockfest.com has sender authentication configured, **When** an email is sent from `updates@beatsontheblockfest.com`, **Then** it lands in the recipient's primary inbox — not spam — on Gmail and Outlook.
2. **Given** a recipient receives a beatsontheblockfest.com email, **When** they inspect the sender, **Then** no security warnings appear (e.g., no "be careful with this message" banner in Gmail).
3. **Given** the same authentication fix is in place, **When** `info@beatsontheblockfest.com` is activated and sends mail, **Then** those emails also land in the primary inbox.

---

### User Story 3 - info@beatsontheblockfest.com Activated as a Working Sender (Priority: P3)

`info@beatsontheblockfest.com` is a confirmed Google Workspace inbox that is currently non-functional — it cannot send or receive because beatsontheblockfest.com has no MX records (inbound routing) and no SPF/DKIM records (outbound authentication). Once the DNS records are in place, the existing inbox will work correctly without any changes to Google Workspace itself.

**Why this priority**: Staff rely on `info@` to receive form submission notifications and respond to inquiries. It is also the reply-to destination for all transactional confirmations.

**Independent Test**: After DNS records are deployed, send a test email to `info@beatsontheblockfest.com` from an external account and confirm it appears in the inbox. Then send an outbound email from `info@` and confirm delivery.

**Acceptance Scenarios**:

1. **Given** MX records are added for beatsontheblockfest.com, **When** an external sender sends email to `info@beatsontheblockfest.com`, **Then** the email is delivered to the Google Workspace inbox.
2. **Given** SPF and DKIM records are added for Google Workspace, **When** staff send an outbound email from `info@beatsontheblockfest.com`, **Then** the email is delivered to the recipient's inbox without spam warnings.
3. **Given** a visitor submits a form, **When** the admin notification is sent to `info@beatsontheblockfest.com`, **Then** it appears in the inbox within 2 minutes.

---

### Edge Cases

- What happens if an email to `info@beatsontheblockfest.com` bounces? The platform should not silently fail — submissions should still be saved to the database even if the notification email fails.
- What if a user replies to a confirmation email sent from `noreply@beatsontheblockfest.com`? Since `noreply@` is a send-only SES address with no inbox, replies will not be received. This is acceptable — no inbox setup is needed for `noreply@`.
- What about existing emails sent from `info@connectevents.co` that are in users' inboxes? No action needed — historical emails are unaffected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: beatsontheblockfest.com MUST have MX records added so that inbound email routes correctly to the Google Workspace inbox for `info@beatsontheblockfest.com`.
- **FR-002**: beatsontheblockfest.com MUST have SPF, DKIM, and DMARC records added covering both Google Workspace (for `info@` and `updates@` staff email) and AWS SES (for `noreply@` transactional email), so that outbound mail from either sender is not marked as spam.
- **FR-003**: beatsontheblockfest.com MUST be verified as an SES sending domain so that `noreply@beatsontheblockfest.com` can send transactional emails.
- **FR-004**: All automated transactional emails (form confirmations sent to users) MUST originate from `noreply@beatsontheblockfest.com`, replacing `noreply@connectevents.co`.
- **FR-005**: Internal admin notification emails MUST be delivered to `info@beatsontheblockfest.com`.
- **FR-006**: Form submissions MUST continue to be saved to the database regardless of email delivery success or failure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Emails from `updates@beatsontheblockfest.com` land in the primary inbox — not spam — on Gmail and Outlook after DNS records are deployed. 0 of 5 test sends filtered as spam.
- **SC-002**: Emails sent to `info@beatsontheblockfest.com` from an external account are delivered to the Google Workspace inbox — 100% inbound deliverability.
- **SC-003**: Emails sent from `info@beatsontheblockfest.com` via Google Workspace reach recipients' inboxes without spam warnings — 0 of 5 test sends filtered as spam.
- **SC-004**: 100% of automated transactional emails show `noreply@beatsontheblockfest.com` as the sender — zero emails reference connectevents.co.
- **SC-005**: Staff receive admin form notification emails at `info@beatsontheblockfest.com` within 2 minutes of a form submission.
- **SC-006**: No degradation in form submission save rate — all form submissions continue to persist to the database at 100%.

## Assumptions

- The `info@beatsontheblockfest.com` Google Workspace inbox already exists and is provisioned — no mailbox creation is needed. The failures are entirely due to missing DNS records.
- `noreply@beatsontheblockfest.com` is a send-only SES address; no Google Workspace inbox is needed for it. Replies to this address will not be received, which is acceptable.
- The sender display name (e.g., "Beats on the Block") will remain unchanged — only the sender address changes.
- All form types currently sending emails via `noreply@connectevents.co` are: DJ applications, contact form, newsletter signups, and sponsor inquiries.
- No email template content changes are needed — only the from-address and notification-destination change.
- Google Workspace DKIM for beatsontheblockfest.com has been generated in Google Admin Console. The TXT record (`google._domainkey`) value is available and can be added to Route53 via CDK with no additional prerequisites.

## Clarifications

### Session 2026-05-26

- Q: What address should automated transactional emails (form confirmations) send from? → A: `noreply@beatsontheblockfest.com` — keep `noreply@` prefix; no Google Workspace inbox needed for this address.
- Q: Where should admin form notifications be delivered, and is the `info@beatsontheblockfest.com` inbox provisioned? → A: `info@beatsontheblockfest.com` — confirmed Google Workspace inbox exists; failures are caused by missing DNS records, not a missing mailbox.
- Q: Has Google Workspace DKIM been generated for beatsontheblockfest.com? → A: Yes — already generated in Google Admin Console. Record name: `google._domainkey`, value available for immediate CDK implementation.

## Dependencies

- beatsontheblockfest.com DNS must be accessible for adding email authentication records (Route53 hosted zone for this domain must exist or be creatable).
- The `info@beatsontheblockfest.com` mailbox must be provisioned and accessible to staff before this feature can be considered complete.
- The email sending service must support domain verification for beatsontheblockfest.com.
