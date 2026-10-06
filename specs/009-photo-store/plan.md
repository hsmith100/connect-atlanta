# Implementation Plan: Event Photo Store

**Branch**: `009-photo-store` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-photo-store/spec.md`

## Summary

Sell event photos as digital downloads on the site. Admins upload full-quality photos. The admin page generates a watermarked preview and thumbnail in the browser and uploads all three directly to S3: originals go to a new **private** bucket, and previews go to the existing media bucket and CloudFront distribution. One `StorePhoto` record links them. Visitors reach the store from the Shop page (the renamed Merch page, now with Merch and Event Photos sections) or from the Gallery, browse previews, build a cart priced server-side with automatic volume-discount tiers, and pay through **Stripe Checkout**. A webhook, plus a reconcile check on the confirmation page, marks orders paid. Buyers then receive a 7-day tokenized download link that issues short-lived pre-signed URLs for the originals. Each sale snapshots the photographer and commission rate, and **Stripe Connect** automatically transfers each photographer's share to their own connected account (they connect a bank once through Stripe's hosted setup). Refunds from the admin take those shares back. Everything runs on the existing stack: a new StoreLambda, 4 new DynamoDB tables, and new static pages plus an admin tab.

## Technical Context

**Language/Version**: TypeScript 5.x: Lambda on Node.js 22.x (ARM64), Next.js 16 static export (TSX), CDK v2
**Primary Dependencies**: Existing: `aws-cdk-lib`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-ses`, `@aws-sdk/client-secrets-manager`, Next.js, React, Tailwind v4, DaisyUI v5. **New**: `stripe` (Lambda only).
**Storage**: DynamoDB, 4 new tables (`store-collections`, `store-photos`, `store-photographers`, `store-orders`). S3: new private `StoreOriginalsBucket`; existing `MediaBucket` under the `store/` prefix for previews and thumbnails.
**Testing**: Jest + ts-jest + `aws-sdk-client-mock` (Lambda); Jest + React Testing Library (frontend). Stripe SDK mocked with `jest.mock('stripe')`.
**Target Platform**: AWS (us-east-1): API Gateway HTTP API → Lambda; S3 + CloudFront; SES
**Project Type**: Web application (static frontend + serverless API + CDK)
**Performance Goals**: First screen of a collection grid < 2s on mobile (SC-002); checkout redirect < 2s; fulfillment email < 5 minutes (US3-3)
**Constraints**: Originals never publicly reachable (SC-004); prices computed only server-side; earnings exact to the cent (SC-007); 300-photo batch uploadable in < 30 min hands-on (SC-001); no Docker on the dev machine (rules out native image libraries)
**Scale/Scope**: ~300–500 photos per event, a few events per year, tens to hundreds of orders per event, under 10 photographers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| # | Principle | Status | Notes |
|---|---|---|---|
| I | Stack Fidelity | ✅ Approved exception | Fits the fixed architecture (static export → S3/CloudFront, API GW → Lambda, DynamoDB, CDK). **Stripe (Checkout + Connect)** is a new external service, unavoidable under FR-014 (PCI) and FR-029 (automatic photographer payments). Approved by the organizer on 2026-10-05; see Complexity Tracking. |
| II | Simplicity First | ✅ | Browser-side watermarking reuses the existing Canvas thumbnail pattern; no image-processing pipeline. Earnings computed on read; no aggregates or cron. TTL cleans up abandoned orders. Settings stored as one item rather than a new table. |
| III | Environment Discipline | ✅ | Stripe test keys in dev, PR and staging; live keys only in prod. Rollout order in quickstart §5. |
| IV | DynamoDB Is Source of Truth | ✅ | Orders (including per-photographer transfer status), photos, photographers and settings all in DynamoDB; Stripe moves the money and holds bank details, which we never store. Table names follow `connect-{prefix}store-*`. |
| V | Security Boundaries | ✅ | Admin routes use the `x-admin-key` / `requireAdmin` pattern. Stripe keys in Secrets Manager. Webhook signature verified. Photographer bank details entered only on Stripe-hosted onboarding. Setup tokens stored hashed. Originals in a separate private bucket, least-privilege grants (StoreLambda only). Download tokens stored hashed. Re-send protected by Turnstile. `siteUrl` allowlisted to prevent open redirects. |
| VI | Lambda Handler Pattern | ✅ | `store.ts` is a thin router. Logic in `storePublic.ts`, `storeCheckout.ts`, `adminStoreCatalog.ts`, `adminStoreOrders.ts`, `adminStorePhotographers.ts`. Shared code in `lib/storeShared.ts`, `lib/storePricing.ts`, `lib/stripeClient.ts`. All SES and Stripe calls awaited; Stripe writes use idempotency keys. |
| VII | Frontend Static Export | ✅ | New pages are static; dynamic IDs passed as query strings; all data fetched client-side. |
| VIII | CDK IaC | ✅ | Tables, bucket, Lambda, secret and routes all in existing stacks. Only manual steps are writing secret values and registering the Stripe webhook (same precedent as Turnstile). |
| IX | Code Quality | ✅ | Types in `shared/types/store.ts`; strict TS; no `any` (Stripe SDK is fully typed). |
| X | Testing Standards | ✅ | Unit tests for every new handler, `storePricing` (tiers, largest-remainder allocation, commission, per-photographer transfer amounts with owed deduction), transfer/refund/reversal-shortfall paths, token helpers, frontend cart context, cart, collection grid, uploader state machine and admin sections. CDK and presentational components exempt. |
| XI | UX Consistency | ✅ | Tailwind and DaisyUI only; loading and error states defined in the UI contract; 320px minimum; admin reuses the Submissions sub-nav, table and CSV patterns. |
| XII | Performance | ✅ | Previews and thumbnails served from the media CloudFront distribution; grid shows thumbnails, previews only on detail view; independent admin fetches parallelized; API routes not cached. Webhook bypasses CloudFront. No handler chaining. |
| XIII | Pre-PR Gate | ✅ | Final task phase runs the full local check suite (quickstart §4). |

**Gate result**: PASS. The Stripe exception to Principle I was approved by the organizer on 2026-10-05.

## Project Structure

### Documentation (this feature)

```text
specs/009-photo-store/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0: R1–R11 decisions
├── data-model.md        # Phase 1: tables, GSIs, state transitions
├── quickstart.md        # Phase 1: setup and end-to-end validation
├── contracts/
│   ├── store-api.md     # Phase 1: public, admin and webhook routes; emails
│   └── store-ui.md      # Phase 1: pages and admin sections
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
shared/types/
└── store.ts                         # NEW: StoreCollection, StorePhoto, Photographer, StoreOrder, OrderLine, PhotographerTransfer, DiscountTier, API payloads

lambda/src/
├── handlers/
│   ├── store.ts                     # NEW: thin router for /api/store/* and /api/admin/store/*
│   ├── storePublic.ts (+ .test.ts)  # NEW: collections, collection page, cart quote, order status, downloads, resend, photographer setup
│   ├── storeCheckout.ts (+ .test.ts)# NEW: checkout, webhook, fulfillOrder (incl. photographer transfers)
│   ├── adminStoreCatalog.ts (+ .test.ts)       # NEW: collections, photos, presign, replace, settings
│   ├── adminStoreOrders.ts (+ .test.ts)        # NEW: orders list, resend, refund + transfer reversals, retry transfers
│   └── adminStorePhotographers.ts (+ .test.ts) # NEW: photographers, Connect setup/dashboard links, status sync, earnings
└── lib/
    ├── storeShared.ts (+ .test.ts)  # NEW: clients, table/bucket env, token gen/hash, email templates, siteUrl allowlist
    ├── storePricing.ts (+ .test.ts) # NEW: pure pricing, discount allocation, commission, transfer amounts, earnings aggregation
    ├── stripeClient.ts              # NEW: cached Stripe client from Secrets Manager; "configured?" check
    └── storeTransfers.ts (+ .test.ts) # NEW: create/retry/reverse photographer transfers, owed-balance handling
    (reuses lib/photoShared.ts requireAdmin/ok/errResponse and lib/turnstile.ts)

infrastructure/lib/stacks/
├── dynamo-stack.ts                  # MODIFY: 4 tables + GSIs; TTL on store-orders.expiresAt
└── backend-stack.ts                 # MODIFY: StoreOriginalsBucket (CORS PUT, lifecycle→Intelligent-Tiering), StripeSecret
                                     #   (import connect-dev-stripe for PR envs), StoreLambda (512MB, 30s), grants, routes
infrastructure/bin/app.ts            # MODIFY: pass stripe secret mode per env

frontend/
├── pages/
│   ├── _app.tsx                     # MODIFY: wrap in StoreCartProvider
│   ├── admin.tsx                    # MODIFY: add Store tab
│   ├── terms-conditions.tsx         # MODIFY: Photo License section
│   ├── gallery.tsx                  # MODIFY: "Shop event photos" banner → /shop#photos
│   ├── merch.tsx                    # MODIFY: becomes a client-side redirect to /shop
│   └── shop/
│       ├── index.tsx                # NEW: Shop hub — Merch section (existing MerchGrid/MerchInfo) + Event Photos section
│       ├── photos.tsx               # NEW: one event's photos (?event=)
│       ├── cart.tsx                 # NEW
│       ├── order.tsx                # NEW
│       ├── photographer-setup.tsx   # NEW: Stripe Connect onboarding hand-off
│       └── download.tsx             # NEW
├── components/
│   ├── layout/Header.tsx            # MODIFY: rename nav "Merch" → "Shop"; cart icon while cart not empty
│   ├── gallery/GalleryLightbox.tsx  # MODIFY: "Buy photos from this event" link
│   ├── store/                       # NEW: CollectionCard, PhotoGrid, PhotoDetailModal, CartSummary, DownloadList, ResendForm (+ tests)
│   └── admin/store/                 # NEW: StoreTab, CollectionsSection, CollectionDetail, StoreUploader,
│                                    #      OrdersSection, PhotographersSection, EarningsPanel, StoreSettingsSection (+ tests)
└── lib/
    ├── api/store.ts, api/adminStore.ts (+ tests)   # NEW: API clients
    └── store/
        ├── cartContext.tsx (+ test) # NEW: localStorage-backed cart
        ├── generateWatermarked.ts   # NEW: preview + thumbnail + tiled watermark (Canvas)
        ├── hashFile.ts              # NEW: SHA-256 for duplicate detection
        └── formatMoney.ts (+ test)  # NEW: cents → "$15.00"
```

**Structure Decision**: Existing web-app layout (`frontend/`, `lambda/`, `infrastructure/`, `shared/types/`). The store gets its **own Lambda** rather than more routes on PhotosLambda. PhotosLambda's router already serves gallery, photos, events, flyers and hero cards. The store needs the Stripe SDK, a different secret, and access to the private originals bucket, and keeping those grants off PhotosLambda preserves least privilege.

## Phase outputs

- **Phase 0** → [research.md](./research.md): storage split (R1), browser-side watermarking (R2), payment provider comparison incl. Rebelity (R3), dual-path idempotent fulfillment (R4), tokenized 7-day downloads (R5), pricing and allocation (R6), sales tax (R7), secrets per env (R8), siteUrl allowlist (R9), scale (R10), cart persistence (R11), automatic photographer payments via Stripe Connect (R12). No NEEDS CLARIFICATION remain.
- **Phase 1** → [data-model.md](./data-model.md), [contracts/store-api.md](./contracts/store-api.md), [contracts/store-ui.md](./contracts/store-ui.md), [quickstart.md](./quickstart.md); agent context updated.

## Post-design Constitution Re-check

Re-evaluated after Phase 1, and again after switching to automatic photographer payments: no new violations. The design adds one Lambda, one bucket, one secret and four tables inside existing stacks, plus one npm dependency (`stripe`). Connect adds no AWS resources; it removes the payouts table and the manual payout UI.

**Cross-stack export note**: BackendStack will import the 4 new table exports. Adding them is safe. If any are ever removed, follow the two-step export-removal pattern (deploy BackendStack `--exclusively` first).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New external service: **Stripe Checkout + Connect** (Principle I; approved 2026-10-05) | FR-013/FR-014 require a PCI-compliant payment provider; FR-029 requires automatically splitting each sale across photographers | Building card handling ourselves is not PCI-compliant. Rebelity (current event POS) has no online store, API or revenue split, and adds ≈ $1.29 per $15 sale. Square and PayPal have no built-in automatic multi-party split. Third-party photo stores (SmugMug/Pixieset) can't track per-photographer commissions and move data out of DynamoDB (Principle IV). See research R3. |
| New npm dependency `stripe` in `lambda/` | Typed API and built-in webhook signature verification | Hand-rolling REST form encoding and HMAC verification adds more code and security risk than the dependency |
| Second Lambda (StoreLambda) instead of extending PhotosLambda | Least privilege: only the store code may read private originals and the Stripe secret (which can move money to photographers) | Adding these grants to PhotosLambda would give gallery, events and hero-card code access to originals and payment keys |
