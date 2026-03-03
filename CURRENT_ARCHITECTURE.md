# Beats on the Beltline — Current Architecture

> This document describes the **existing** infrastructure as it was built. For the migration plan to modernize this stack, see `MIGRATION_PLAN.md`.
>
> **Context:** The site was never publicly launched. The team's current workflow uses Google Forms and Google Sheets as the primary data collection system. The PostgreSQL database on the EC2 instance contains no meaningful production data. The team owns all Google accounts and all event media (stored in Google Drive). Cloudinary is a delivery layer only.

---

## Table of Contents
1. [Infrastructure Overview](#1-infrastructure-overview)
2. [Container Layout](#2-container-layout)
3. [Request Flow](#3-request-flow)
4. [Form Submission Data Flow](#4-form-submission-data-flow)
5. [Deployment Process](#5-deployment-process)
6. [Database Schema](#6-database-schema)
7. [External Service Dependencies](#7-external-service-dependencies)

---

## 1. Infrastructure Overview

The entire application runs on a **single EC2 instance** provisioned by a third-party platform called Server Burger. There is no IaC, no load balancer, no redundancy, and no SSL.

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │  Raw HTTP (no SSL)
                           │
            ┌──────────────▼──────────────┐
            │     EC2 Instance             │
            │     98.81.74.242             │
            │     (Server Burger / AWS)    │
            │                             │
            │  ┌─────────┐ ┌──────────┐   │
            │  │  :3000  │ │  :8000   │   │
            │  │ Next.js │ │ FastAPI  │   │
            │  └────┬────┘ └────┬─────┘   │
            │       │           │         │
            │  ┌────▼───────────▼─────┐   │
            │  │   burger_network     │   │
            │  │   (Docker bridge)    │   │
            │  └──────────┬───────────┘   │
            │             │               │
            │       ┌─────▼──────┐        │
            │       │  :5432     │        │
            │       │ PostgreSQL │        │
            │       └────────────┘        │
            │                             │
            └─────────────────────────────┘
```

**Key facts:**
- No domain name — served directly on raw IP `98.81.74.242`
- No HTTPS — all traffic including form submissions (PII) is plain HTTP
- No load balancer — the EC2 instance is the single point of entry
- No auto-scaling — fixed t-class instance with hard memory/CPU caps
- A second IP (`54.210.148.147`) exists from the original Server Burger provisioning — likely an unused older instance

**Estimated current cost:**
Server Burger is a managed platform on top of AWS. For a setup running 3 containers requiring ~2GB RAM, the estimated cost is **$40–80/month (~$480–960/year)**. This is a fixed cost regardless of traffic — the instance runs and bills identically on a quiet Tuesday as it does during an event day with thousands of visitors.

---

## 2. Container Layout

Three containers run inside Docker Compose on the EC2 host, connected via a Docker bridge network named `burger_network`.

```
┌─────────────────────────────────────────────────────────────────────┐
│  EC2 Host: 98.81.74.242                                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Docker Compose  (docker-compose.prod.yml)                   │   │
│  │                                                              │   │
│  │  ┌─────────────────────┐   ┌─────────────────────────────┐  │   │
│  │  │ connect-frontend    │   │ connect-backend-fastapi     │  │   │
│  │  │ nextjs              │   │                             │  │   │
│  │  │ node:18-alpine      │   │ python:3.11-slim            │  │   │
│  │  │                     │   │                             │  │   │
│  │  │ Port: 3000:3000      │   │ Port: 8000:8000             │  │   │
│  │  │ CPU:  0.8 limit      │   │ CPU:  0.4 limit             │  │   │
│  │  │ RAM:  1024MB limit   │   │ RAM:  384MB limit           │  │   │
│  │  │                     │   │                             │  │   │
│  │  │ depends_on:         │   │ depends_on:                 │  │   │
│  │  │   backend (healthy) │   │   database (healthy)        │  │   │
│  │  └──────────┬──────────┘   └─────────────┬───────────────┘  │   │
│  │             │                             │                  │   │
│  │             │      burger_network         │                  │   │
│  │             │      (bridge driver)        │                  │   │
│  │             └──────────────┬──────────────┘                  │   │
│  │                            │                                 │   │
│  │             ┌──────────────▼──────────────┐                  │   │
│  │             │ connect-database-postgresql  │                  │   │
│  │             │                             │                  │   │
│  │             │ postgres:15-alpine           │                  │   │
│  │             │ Port: 5432:5432 (host-bound) │                  │   │
│  │             │ CPU:  0.5 limit              │                  │   │
│  │             │ RAM:  512MB limit            │                  │   │
│  │             │                             │                  │   │
│  │             │ Volume: postgresql_data      │                  │   │
│  │             │ (named Docker volume)        │                  │   │
│  │             └─────────────────────────────┘                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Container communication:**
- Frontend → Backend: via Docker DNS (`http://backend:8000`) — internal to `burger_network`
- Backend → Database: via Docker DNS (`postgresql://database:5432`) — internal to `burger_network`
- Database port 5432 is also bound to the EC2 host — potentially reachable from the internet depending on security group rules

---

## 3. Request Flow

### Page Load

```
Browser
  │
  │  GET http://98.81.74.242:3000/events
  │
  ▼
Next.js (connect-frontend-nextjs :3000)
  │
  │  Returns static HTML shell + JavaScript bundle
  │  (No server-side rendering — all pages use client-side data fetching)
  │
  ▼
Browser executes JavaScript
  │
  │  fetch('http://98.81.74.242:8000/api/events')
  │  (via Next.js rewrite: /api/* → http://backend:8000/api/*)
  │
  ▼
Next.js rewrites request internally to:
  │
  │  GET http://backend:8000/api/events
  │
  ▼
FastAPI (connect-backend-fastapi :8000)
  │
  │  SELECT * FROM events ORDER BY date DESC
  │
  ▼
PostgreSQL (connect-database-postgresql :5432)
  │
  │  Returns rows
  │
  ▼
FastAPI serializes to JSON → returns to Next.js rewrite → returns to browser
  │
  ▼
Browser renders event cards
```

### Gallery Load

```
Browser clicks event → handleEventClick(eventId)
  │
  │  GET /api/events/{id}/gallery
  │
  ▼
FastAPI
  │
  ├─► PostgreSQL: SELECT cloudinary_folder FROM events WHERE id = ?
  │
  └─► Cloudinary API (external HTTPS call)
        │  cloudinary.api.resources(prefix="events/{folder}/")
        │
        ▼
       Returns photo/video URLs
  │
  ▼
FastAPI updates photo_count/video_count cache in PostgreSQL
  │
  ▼
Returns gallery JSON to browser → browser renders photo grid
```

> **Confirmed via KT session:** Cloudinary was never actually connected. The API secret was committed to `docker-compose.prod.yml` but the credentials were never configured in the running environment. The `/gallery` page would always resolve to the empty state ("No photos available yet"). The backend gallery routes are scaffolded dead code.
>
> **The actual photo carousel** on the homepage is a hardcoded array of local image paths in `pages/index.js`, pointing to files in `public/images/events/`. No backend or Cloudinary involvement at any point.

---

## 4. Form Submission Data Flow

All five form types follow the same pattern. Below is the vendor application as an example — the others are identical in structure.

```
Browser (user fills out vendor application form)
  │
  │  POST /api/forms/vendor-application
  │  (JSON body with form fields)
  │
  ▼
Next.js (/pages/api/forms/vendor-application.js)
  │  Acts as a server-side proxy — forwards to backend
  │
  │  POST http://backend:8000/api/forms/vendor-application
  │
  ▼
FastAPI (/routes/forms.py → submit_vendor_application)
  │
  ├─► [1] PostgreSQL INSERT
  │     INSERT INTO vendor_applications (...) RETURNING id, created_at
  │     conn.commit()
  │
  ├─► [2] Google Sheets sync (fire-and-forget, failures silently swallowed)
  │     google_sheets_service.submit_vendor_application(data)
  │       │
  │       ├─ Requires GOOGLE_CREDENTIALS_JSON or GOOGLE_CREDENTIALS_PATH env var
  │       │  (NOT present in this repo — sync is likely broken in production)
  │       │
  │       └─► Google Sheets API → append row to VENDOR_SHEET_ID
  │
  └─► Returns { success: true, id: ..., created_at: ... }
  │
  ▼
Next.js proxy returns response to browser
  │
  ▼
Browser shows success message
```

**Sponsor inquiry also sends an email:**
```
FastAPI (submit_sponsor_inquiry)
  │
  ├─► PostgreSQL INSERT
  ├─► Google Sheets sync
  └─► EmailService.send_sponsor_inquiry_notification()
        │
        └─► SMTP server (credentials not visible in repo)
```

**What happens when Google Sheets fails:**
```python
try:
    google_sheets_service.submit_vendor_application(data)
except Exception as e:
    print(f"Warning: Failed to sync to Google Sheets: {str(e)}")
    # execution continues — the user sees success regardless
```
The form always returns success to the user even if the Sheets sync silently fails. In the intended design, PostgreSQL is the authoritative source of truth and Sheets is a secondary view.

**Actual state:** The site was never launched, so the database contains no real submissions. The team's actual application data — vendor applications, volunteer sign-ups, DJ/artist applications, sponsor inquiries, email signups — lives in Google Sheets via Google Forms, which is the team's current primary workflow. The EC2 database has nothing worth preserving.

---

## 5. Deployment Process

There is no CI/CD pipeline. Deployment is a manual bash script run from a developer's machine.

```
Developer's Machine
  │
  │  ./scripts/deploy.sh
  │
  ▼
┌─────────────────────────────────────────────────────┐
│  deploy.sh                                           │
│                                                      │
│  1. Check SSH key exists (~/.ssh/basb-ec2-key)       │
│  2. rsync local files → ubuntu@98.81.74.242:         │
│       /opt/custom-build/                             │
│     Excludes: .git, node_modules, .env.local,        │
│               __pycache__, .next, dist, build        │
│                                                      │
│  3. SSH into EC2 and run:                            │
│       cd /opt/custom-build                           │
│       docker compose -f docker-compose.prod.yml      │
│         up -d --build                                │
│                                                      │
│  4. Health check: curl http://98.81.74.242:8000/     │
└─────────────────────────────────────────────────────┘
  │
  ▼
EC2 Instance
  │
  │  Docker builds images from source on the EC2 machine
  │  (no pre-built images, no registry)
  │
  ▼
Containers restart with new code
```

**Problems with this approach:**
- No review gate — any developer can deploy any branch directly to production
- No automated tests run before deploy
- No rollback mechanism — to revert you must re-rsync an older version and rebuild
- No deployment history or audit trail
- SSH key must exist on the deploying machine — if the key is lost, deployment is impossible
- Secrets (`CLOUDINARY_API_SECRET`, `POSTGRES_PASSWORD`, etc.) are committed in `docker-compose.prod.yml` and synced to the server in plaintext

---

## 6. Database Schema

PostgreSQL 15, running in Docker, persisted in a named volume `postgresql_data`.

```
┌──────────────────────────────────────────────────────────────┐
│  events                                                       │
├──────────────────┬───────────────┬──────────────────────────┤
│ id               │ SERIAL PK     │                          │
│ title            │ VARCHAR(255)  │                          │
│ date             │ DATE          │ idx_events_date          │
│ location         │ VARCHAR(255)  │                          │
│ description      │ TEXT          │                          │
│ flyer_url        │ TEXT          │                          │
│ attendees        │ VARCHAR(50)   │                          │
│ artists          │ TEXT          │                          │
│ cloudinary_folder│ VARCHAR(255)  │ idx_events_cloudinary    │
│ gallery_enabled  │ BOOLEAN       │ idx_events_gallery_ena.. │
│ photo_count      │ INTEGER       │ (cached from Cloudinary) │
│ video_count      │ INTEGER       │ (cached from Cloudinary) │
│ gallery_updated_at│ TIMESTAMP   │                          │
│ created_at       │ TIMESTAMP     │                          │
│ updated_at       │ TIMESTAMP     │                          │
└──────────────────┴───────────────┴──────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  email_signups                                                │
├──────────────────┬───────────────┬──────────────────────────┤
│ id               │ SERIAL PK     │                          │
│ name             │ VARCHAR(255)  │                          │
│ email            │ VARCHAR(255)  │ UNIQUE, idx_email_signup │
│ phone            │ VARCHAR(50)   │                          │
│ marketing_consent│ BOOLEAN       │                          │
│ source           │ VARCHAR(50)   │                          │
│ created_at       │ TIMESTAMP     │ idx_email_created_at     │
│ updated_at       │ TIMESTAMP     │                          │
└──────────────────┴───────────────┴──────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  vendor_applications                                          │
├──────────────────┬───────────────┬──────────────────────────┤
│ id               │ SERIAL PK     │                          │
│ business_name    │ VARCHAR(255)  │                          │
│ contact_name     │ VARCHAR(255)  │                          │
│ email            │ VARCHAR(255)  │ idx_vendor_email         │
│ phone            │ VARCHAR(50)   │                          │
│ business_type    │ VARCHAR(100)  │                          │
│ description      │ TEXT          │                          │
│ website_social   │ TEXT          │                          │
│ price_point      │ VARCHAR(100)  │                          │
│ has_insurance    │ VARCHAR(10)   │                          │
│ food_permit      │ VARCHAR(10)   │                          │
│ setup            │ VARCHAR(500)  │                          │
│ additional_comments│ TEXT        │                          │
│ status           │ VARCHAR(50)   │ idx_vendor_status        │
│ notes            │ TEXT          │                          │
│ created_at       │ TIMESTAMP     │ idx_vendor_created_at    │
│ updated_at       │ TIMESTAMP     │                          │
└──────────────────┴───────────────┴──────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  volunteer_applications                                       │
├──────────────────┬───────────────┬──────────────────────────┤
│ id               │ SERIAL PK     │                          │
│ first_name       │ VARCHAR(255)  │                          │
│ last_name        │ VARCHAR(255)  │                          │
│ email            │ VARCHAR(255)  │ idx_volunteer_email      │
│ phone            │ VARCHAR(50)   │                          │
│ experience       │ TEXT          │                          │
│ skills           │ JSONB         │                          │
│ status           │ VARCHAR(50)   │ idx_volunteer_status     │
│ notes            │ TEXT          │                          │
│ created_at       │ TIMESTAMP     │ idx_volunteer_created_at │
│ updated_at       │ TIMESTAMP     │                          │
└──────────────────┴───────────────┴──────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  artist_applications                                          │
├──────────────────┬───────────────┬──────────────────────────┤
│ id               │ SERIAL PK     │                          │
│ email            │ VARCHAR(255)  │ idx_artist_email         │
│ full_legal_name  │ VARCHAR(255)  │                          │
│ dj_name          │ VARCHAR(255)  │                          │
│ city             │ VARCHAR(255)  │                          │
│ phone            │ VARCHAR(50)   │                          │
│ instagram_link   │ VARCHAR(500)  │                          │
│ contact_method   │ VARCHAR(50)   │                          │
│ artist_bio       │ TEXT          │                          │
│ b2b_favorite     │ TEXT          │                          │
│ main_genre       │ VARCHAR(100)  │                          │
│ sub_genre        │ VARCHAR(100)  │                          │
│ other_sub_genre  │ VARCHAR(100)  │                          │
│ other_genre_text │ TEXT          │                          │
│ live_performance_links│ TEXT     │                          │
│ soundcloud_link  │ VARCHAR(500)  │                          │
│ spotify_link     │ VARCHAR(500)  │                          │
│ rekordbox_familiar│ VARCHAR(10)  │                          │
│ promo_kit_links  │ TEXT          │                          │
│ additional_info  │ TEXT          │                          │
│ status           │ VARCHAR(50)   │ idx_artist_status        │
│ notes            │ TEXT          │                          │
│ created_at       │ TIMESTAMP     │ idx_artist_created_at    │
│ updated_at       │ TIMESTAMP     │                          │
└──────────────────┴───────────────┴──────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  sponsor_inquiries                                            │
├──────────────────┬───────────────┬──────────────────────────┤
│ id               │ SERIAL PK     │                          │
│ name             │ VARCHAR(255)  │                          │
│ email            │ VARCHAR(255)  │ idx_sponsor_email        │
│ phone            │ VARCHAR(50)   │                          │
│ company          │ VARCHAR(255)  │                          │
│ product_industry │ TEXT          │                          │
│ status           │ VARCHAR(50)   │ idx_sponsor_status       │
│ notes            │ TEXT          │                          │
│ created_at       │ TIMESTAMP     │ idx_sponsor_created_at   │
│ updated_at       │ TIMESTAMP     │                          │
└──────────────────┴───────────────┴──────────────────────────┘
```

**No foreign keys** exist between tables — `events` is independent of all application tables. The schema was built with raw SQL migration files (`/backend/migrations/`) with no migration framework tracking which have been applied.

---

## 7. External Service Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│  FastAPI Backend                                                 │
└──────┬────────────────┬───────────────────┬─────────────────────┘
       │                │                   │
       ▼                ▼                   ▼
┌─────────────┐  ┌─────────────────┐  ┌──────────────────────┐
│  Cloudinary  │  │  Google Sheets  │  │  SMTP / Email        │
│              │  │                 │  │                      │
│ Cloud:       │  │ 5 sheet IDs     │  │ Credentials not      │
│ beats-on-    │  │ hardcoded in    │  │ visible in repo      │
│ beltline     │  │ service class   │  │                      │
│              │  │                 │  │ Used for:            │
│ Credentials  │  │ Auth via Google │  │ - Contact forms      │
│ hardcoded in │  │ service account │  │ - Sponsor inquiry    │
│ docker-      │  │ (credentials    │  │   notifications      │
│ compose.prod │  │ NOT in repo —   │  │                      │
│              │  │ sync likely     │  │                      │
│ Used for:    │  │ broken)         │  │                      │
│ - Gallery    │  │                 │  │                      │
│   photo/     │  │ Used for:       │  │                      │
│   video      │  │ - All 5 form    │  │                      │
│   retrieval  │  │   type syncs    │  │                      │
└─────────────┘  └─────────────────┘  └──────────────────────┘
```

### Dependency Health Summary

| Service | Status | Risk |
|---------|--------|------|
| **PostgreSQL** | Running in Docker on EC2 | Contains no real production data — site was never launched. Not worth preserving. |
| **Cloudinary** | Never actually connected — credentials not in running environment | The gallery backend routes are dead scaffolded code. The homepage carousel uses static files from `public/images/events/`. No Cloudinary media to migrate. Account can be ignored entirely. |
| **Google Sheets** | Credentials missing from repo | Sync almost certainly never worked in this deployment. **Irrelevant** — the team uses Google Forms → Sheets directly as their primary workflow, bypassing this app entirely. |
| **SMTP / Email** | Credentials not visible in repo | Unknown status. Replaceable with AWS SES. |
| **EC2 Instance** | Running; not owned by current team | Can be abandoned — no meaningful data on it. |
