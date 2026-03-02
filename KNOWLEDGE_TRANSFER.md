# Beats on the Beltline — Knowledge Transfer Checklist

> This document is intended to guide a handoff session with the previous developer.
> Each item includes what is needed, why it matters, and what is lost if it cannot be recovered.

> **STATUS UPDATE:** The site has never gone live. The team's current workflow uses Google Forms and Google Sheets as the primary data collection and review system — the PostgreSQL database on the old server contains no meaningful production data.
>
> **Confirmed ownership:**
> - All Google accounts (Workspace, Gmail, Sheets, Cloud Console, Drive) — owned by the team
> - All event photos and videos — stored in Google Drive, owned by the team; Cloudinary is just a delivery layer and is not needed
> - The codebase
>
> **Not owned / not needed:**
> - Server Burger account — server has no real data; can be abandoned
> - Cloudinary `beats-on-beltline` account — source images are in Google Drive; a new Cloudinary account can be created, or images can be moved to S3 entirely
>
> **KT session with the previous developer is optional.** The migration can proceed without it.

---

## Table of Contents
1. [Account Access](#1-account-access)
2. [Credentials Not in the Repo](#2-credentials-not-in-the-repo)
3. [Data to Export Before Handoff](#3-data-to-export-before-handoff)
4. [Context Only the Previous Developer Knows](#4-context-only-the-previous-developer-knows)
5. [What Happens If Items Are Unrecoverable](#5-what-happens-if-items-are-unrecoverable)
6. [Session Checklist](#6-session-checklist)

---

## 1. Account Access

### SSH Key / Server Access — **LOW PRIORITY**
**What:** The PEM key used to SSH into the production EC2 instance (`98.81.74.242`). The original key referenced in the codebase is `~/.ssh/serverburger-1-27.pem`.

**Current status:** Confirmed unavailable — SSH was attempted and failed. No Server Burger keys exist on the new developer's machine.

**Why this is now low priority:** The site was never launched. The PostgreSQL database on this server contains no meaningful production data. The team's real data lives in Google Sheets. Nothing is lost if this server is terminated.

**What is lost without it:** Nothing meaningful — the database is empty or contains only test data.

---

### Server Burger Account
**What:** Login credentials for the Server Burger platform (`buildaburger.com` or similar) that was used to provision the EC2 instances.

**Why:** Server Burger is the platform that owns the underlying AWS infrastructure. The EC2 instances (`54.210.148.147` and `98.81.74.242`) live in an AWS account controlled by Server Burger or the previous developer. Access is needed to either transfer the servers, extend the billing so they aren't terminated during migration, or at minimum confirm how long the instances will remain active.

**What is lost without it:** The instances could be terminated at any time with no warning, taking the database with them.

---

### Cloudinary Account — **NOT NEEDED**
**Account name:** `beats-on-beltline`

**Status:** The team owns all source images and videos in Google Drive. Cloudinary is a delivery mechanism only — it does not own any content.

**Resolution options:**
1. Create a new Cloudinary free account, re-upload images from Google Drive matching the folder structure (`events/{folder}/photos/`, `events/{folder}/videos/`), update the credentials in the new environment.
2. Move images to S3 and serve via CloudFront — eliminates Cloudinary as a dependency entirely. This is the recommended approach since the migration is already targeting S3 + CloudFront. The only feature lost is on-the-fly URL-based transformations; thumbnails would need to be pre-generated on upload.

**What is lost without recovering the old account:** Nothing. Source files are in Google Drive.

---

### `connectevents.co` Domain Registrar
**What:** Login to wherever the domain `connectevents.co` is registered (GoDaddy, Namecheap, Google Domains, Cloudflare, etc.).

**Why:** The domain is referenced throughout the application as the production URL. During migration, DNS records will need to be updated to point to the new AWS infrastructure. Without registrar access, traffic cannot be redirected and SSL certificates cannot be properly issued.

**What is lost without it:** Unable to point the domain to the new infrastructure. The app either stays on the old IP or requires a new domain entirely.

---

### Google Workspace / Gmail (for `connectevents.co`)
**What:** Access to the email account associated with `info@connectevents.co`, plus the SMTP credentials used to send outbound emails.

**Why:** The email service defaults to `smtp.gmail.com:587` and delivers contact form submissions and sponsor inquiry notifications to `info@connectevents.co`. The `SMTP_USER` and `SMTP_PASSWORD` environment variables are not in the repo — they exist only in the running server environment. Without them, contact and sponsor notification emails are silently failing.

**What is lost without it:** No outbound email for contact forms or sponsor inquiries. These are the two highest-value form types for business operations.

---

### Google Cloud Console (Service Account)
**What:** Access to the Google Cloud project that contains the service account used for the Google Sheets API integration. Specifically, the `GOOGLE_CREDENTIALS_JSON` value.

**Why:** The Sheets sync requires a Google service account with access granted to each of the 5 spreadsheets. These credentials were never committed to the repo. Without them, the Sheets integration has been silently failing the entire time the app has been deployed.

**Note:** This is lower priority than the others — all submission data is safely in PostgreSQL regardless of Sheets sync status. This is only needed if the Sheets workflow needs to be restored during the transition period.

**What is lost without it:** Unable to verify or restore the Google Sheets sync. The transition to a proper admin UI can proceed without it.

---

### Google Sheets (5 Spreadsheets)
**What:** View/edit access to the 5 Google Sheets that receive form submissions:
- Vendor Applications: `1SUbvzglTqd6iFmAe69XRB__0APhSKfRUHl1zpHUGs-A`
- Volunteer Applications: `1-V9HV0AJWqdz0yqIrNQuC2quzGGBFGsRGW5hjfbqZCA`
- DJ/Artist Applications: `1EF3DzG4OjayDjsZtWNezsPh6EwDKKMJWKIAr67LtGls`
- Email Signups: `12gfqB3p103wo8vSzl1WUNys4dmbi8hV8nan6ND7LH8I`
- Sponsor Inquiries: (configured via env var — ask previous developer for the ID)

**Why:** The team has been using these sheets as their application review workflow. The DJ sheet in particular has a `RATING` column that the team manually fills in. Any ratings, status updates, or notes added directly to the sheets exist **only in the sheets** — they are not in the database. This data needs to be exported before the sheets are decommissioned.

**What is lost without it:** Historical review decisions, DJ ratings, and any manual annotations the team has added. Submission data itself is safe in PostgreSQL.

---

### Google Analytics
**Property ID:** `G-86ZLZS2JEX`

**What:** Access to the Google Analytics 4 property associated with this ID.

**Why:** Historical traffic and event data lives here — page views, user counts, traffic sources around past events. Not operationally critical, but useful context for understanding audience behavior going forward.

**What is lost without it:** Historical analytics data only. The application functions normally without it.

---

## 2. Credentials Not in the Repo

These environment variables are referenced in the code but were never committed to the repository. They exist only in the running server environment. Ask the previous developer to provide each of these values directly.

| Variable | Used For | Where to Find |
|----------|----------|---------------|
| `SMTP_USER` | Gmail/Workspace account for outbound email | Server environment or the developer's notes |
| `SMTP_PASSWORD` | Gmail app password or SMTP credential | Server environment or the developer's notes |
| `SMTP_HOST` | SMTP server (defaults to `smtp.gmail.com`) | Likely the default unless overridden |
| `SMTP_PORT` | SMTP port (defaults to `587`) | Likely the default unless overridden |
| `SMTP_FROM_EMAIL` | The "from" address on outbound emails | Server environment |
| `GOOGLE_CREDENTIALS_JSON` | Google service account for Sheets API | Google Cloud Console → Service Accounts |
| `SPONSOR_INQUIRY_SHEET_ID` | 5th Google Sheet for sponsor inquiries | Developer's notes or Google Sheets URL |

**How to retrieve values from the running server:**
```bash
ssh -i ~/.ssh/serverburger-1-27.pem ubuntu@98.81.74.242
cat /opt/custom-build/.env
cat /opt/custom-build/backend/.env
docker inspect connect-backend-fastapi | grep -A 50 '"Env"'
```

---

## 3. Data to Export Before Handoff

These exports should happen **during or immediately after** the KT session while server access is still available.

### PostgreSQL Database Dump
**This is the most important export.** Run during the session if possible:
```bash
ssh -i ~/.ssh/serverburger-1-27.pem ubuntu@98.81.74.242 \
  "docker exec connect-database-postgresql \
   pg_dump -U burger_user burger_app" > prod_dump_$(date +%Y%m%d).sql
```
Store the resulting `.sql` file somewhere safe immediately. This is the complete record of all form submissions.

### Google Sheets Export
For each of the 5 sheets: File → Download → CSV. Pay particular attention to:
- **DJ/Artist sheet** — export before anything else. The `RATING` column (column B) contains manual review scores that exist nowhere else.
- **Vendor sheet** — any status notes or approvals added manually
- **All others** — for completeness

### Cloudinary Media
Cloudinary retains media as long as the account is active. Once account access is confirmed, no immediate action is needed. However, confirm during the session:
- Whether there is a paid plan and when it renews
- Whether all event folders are organized under `events/`
- Whether there is any media outside of `events/` that the app depends on

---

## 4. Context Only the Previous Developer Knows

Beyond credentials and accounts, ask the previous developer these questions directly — the answers are not in the codebase.

**Server & Deployment**
- Is the Server Burger subscription still active and paid? When does it renew or expire?
- Is the SSH key `serverburger-1-27.pem` still valid, or was it rotated? Where is the current key?
- Have there been any manual changes made directly on the server (outside of deployments) that aren't reflected in the repo?
- Is `54.210.148.147` still in use for anything, or is `98.81.74.242` the only active instance?

**Email**
- What Gmail or Workspace account is used as the SMTP sender?
- Is it a personal Gmail, a Google Workspace account for `connectevents.co`, or a third-party SMTP provider?
- Have contact form or sponsor inquiry emails actually been working in production?

**Google Sheets**
- Have the Google Sheets been receiving submissions? When was the last row added?
- Which Google account owns the 5 sheets — is it a personal account or a shared org account?
- What is the Sponsor Inquiry Sheet ID (it is not hardcoded in the repo)?
- Is there a Google Cloud project with a service account set up? If so, what is the project name?

**Cloudinary**
- Is the Cloudinary account on a free plan or paid? What are the storage limits?
- Who manages photo/video uploads to Cloudinary — is there a process for uploading after each event?
- Are there any photos or videos stored outside the `events/` folder structure that the gallery uses?

**Application History**
- Are there any known bugs or issues with the current production app?
- Has anything been changed directly on the server that isn't in the repository?
- Has the application ever had SSL/HTTPS configured? Was there a domain pointing to it at any point?
- Are there any other developers or admins who have SSH access to the server?

**Business Context**
- Who on the team has been managing vendor/volunteer/artist applications in the Google Sheets?
- Are there pending or approved applications in the sheets that need to be preserved?
- Is there a process document or runbook for how the team runs events? (Useful for building the admin page)

---

## 5. What Happens If Items Are Unrecoverable

| Priority | Item | If Unrecoverable |
|----------|------|-----------------|
| **Critical** | **Google Sheets (5 sheets)** | All real application data is lost — vendor applications, volunteer sign-ups, DJ/artist applications, email signups, sponsor inquiries. DJ/Artist `RATING` column and any manual review notes exist nowhere else. Export all sheets to CSV immediately. |
| **Critical** | **Cloudinary account** | All event gallery photos and videos are permanently lost. Cannot be reconstructed from any system source — must be sourced from Google Drive, photographer hard drives, or team phones. |
| **High** | **`connectevents.co` domain** | Cannot redirect to new infrastructure. Pursue ICANN transfer dispute or launch under a new domain entirely. |
| **High** | **Google Workspace / SMTP credentials** | Contact form and sponsor inquiry emails will not work on launch. Fully replaceable with AWS SES — this removes the Gmail dependency entirely. |
| **Low** | **SSH key / server access** | Database on the server is empty (site was never live). Nothing meaningful is lost. Server can be abandoned. |
| **Low** | **Server Burger account** | No production data on the server. Instance can be allowed to lapse. |
| **Low** | **Google Cloud service account** | Sheets sync in the new app can be set up fresh or replaced by the built-in admin page entirely. |
| **Low** | **Google Analytics** | No historical traffic data worth preserving. Set up a new GA4 property going forward. |

---

## 6. Session Checklist

Use this as a running checklist during the KT session.

### Accounts — Get Access or Transfer
**Already owned — confirm access before KT session**
- [ ] Shared view/edit access to all 5 Google Sheets (Vendors, Volunteers, DJ/Artist, Email Signups, Sponsor Inquiries)
- [ ] Google Workspace / Gmail account for `info@connectevents.co`
- [ ] Google Cloud Console access (for new service account setup)
- [ ] `connectevents.co` domain registrar login or DNS transfer initiated

**Not needed — no recovery required**
- [ ] Cloudinary — create a new account; source images are in Google Drive
- [ ] Server Burger account — server has no real data; can be abandoned
- [ ] SSH key — database is empty; not needed

### Credentials — Collect Values
- [ ] `SMTP_USER` and `SMTP_PASSWORD` — or skip and replace with AWS SES
- [ ] `SMTP_FROM_EMAIL`
- [ ] `GOOGLE_CREDENTIALS_JSON` — for Sheets sync during transition period
- [ ] `SPONSOR_INQUIRY_SHEET_ID` — 5th sheet ID not hardcoded in repo

### Data Exports — Do During Session (or Before)
**These contain your only real application data:**
- [ ] Export DJ/Artist Google Sheet as CSV — **RATING column is highest priority, exists nowhere else**
- [ ] Export Vendor Applications Sheet as CSV — include any status/approval notes
- [ ] Export Volunteer Applications Sheet as CSV
- [ ] Export Email Signups Sheet as CSV
- [ ] Export Sponsor Inquiries Sheet as CSV
- [ ] Confirm Cloudinary account is accessible and note plan/renewal date

*Note: pg_dump from the EC2 server is no longer needed — the database contains no production data.*

### Questions — Get Answers
- [ ] Who on the team manages the application review workflow in sheets? (They need access to the new admin page)
- [ ] Are there pending or approved applications in the sheets that need to be imported into the new system?
- [ ] Who manages Cloudinary uploads after events? Is there a process for this?
- [ ] What Google account owns the 5 sheets — personal or shared org account?
- [ ] What is the Sponsor Inquiry Sheet ID? (Not hardcoded in the repo)
- [ ] Is there a process document for how the team reviews vendor/volunteer/DJ applications?
