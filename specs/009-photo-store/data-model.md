# Data Model: Event Photo Store

**Feature**: 009-photo-store | **Date**: 2026-10-05

Four new DynamoDB tables, all `PAY_PER_REQUEST`, defined in `DynamoStack` with the standard `connect-{prefix}` naming (Principle IV). Prod names are shown; staging, dev and PR environments add their prefix (e.g. `connect-staging-store-orders`). TypeScript types live in `shared/types/store.ts` (Principle IX).

All money is stored as **integer cents (USD)**. All timestamps are ISO-8601 strings.

```text
Event (existing) 1───1 StoreCollection 1───* StorePhoto *───1 Photographer ───1 Stripe Express account
                                                  │                 │
                                                  │ snapshotted in  │ paid via
                                                  ▼                 ▼
                              StoreOrder 1───* OrderLine     StoreOrder 1───* PhotographerTransfer
```

---

## StoreCollection — `connect-store-collections`

One for-sale collection per event.

| Field | Type | Notes |
|---|---|---|
| `id` | string (PK) | UUID |
| `entity` | `'COLLECTION'` | GSI partition key |
| `eventId` | string | FK to `connect-events.id`; at most one collection per event (enforced in create) |
| `title` | string | Defaults to the event name |
| `eventDate` | string | Copied from the event for sorting; GSI sort key |
| `status` | `'draft' \| 'published'` | Only `published` collections are visible publicly (FR-005) |
| `defaultPriceCents` | number | > 0, required before publish (FR-004) |
| `defaultPhotographerId` | string \| null | Pre-fills the photographer for new uploads |
| `coverPhotoId` | string \| null | Falls back to the first photo by `sortOrder` (FR-006) |
| `photoCount` | number | Count of `forSale` photos, maintained on photo create/update/delete |
| `createdAt`, `updatedAt` | string | |

**GSI `byEventDate`**: PK `entity`, SK `eventDate` (descending query gives newest first, FR-009).

**Settings item** (same table, excluded from the GSI because it has no `entity`):

| Field | Type | Notes |
|---|---|---|
| `id` | `'SETTINGS'` | Fixed key |
| `discountTiers` | `{ minQty: number; pctOff: number }[]` | Default `[{3,15},{5,25},{10,35}]`. Validation: `minQty` ≥ 2 and strictly increasing, `pctOff` 1–90 and strictly increasing. |

**State transitions**: `draft → published` requires `defaultPriceCents > 0`, at least one `forSale` photo, every `forSale` photo having a `photographerId`, and each of those photographers having `payoutsReady = true` (FR-029a). `published → draft` is always allowed.

---

## StorePhoto — `connect-store-photos`

One record links a private original to its public watermarked versions (FR-003a).

| Field | Type | Notes |
|---|---|---|
| `id` | string (PK) | UUID, generated in the browser before upload |
| `collectionId` | string | GSI partition key |
| `sortOrder` | number | GSI sort key |
| `originalKey` | string | `originals/{id}.{ext}` in **StoreOriginalsBucket** (private, never returned by public APIs) |
| `originalFilename` | string | Used as the download filename |
| `originalBytes` | number | |
| `width`, `height` | number | Of the original |
| `contentHash` | string | SHA-256 hex; duplicate detection within the collection |
| `previewUrl` | string | Media CloudFront URL, `store/previews/{id}-{ts}.jpg` |
| `thumbnailUrl` | string | Media CloudFront URL, `store/thumbs/{id}-{ts}.jpg` |
| `photographerId` | string | Required (FR-025) |
| `priceOverrideCents` | number \| null | Effective price = `priceOverrideCents ?? collection.defaultPriceCents` |
| `status` | `'forSale' \| 'hidden' \| 'removed'` | `hidden` = admin-hidden (FR-006); `removed` = takedown (FR-005, US6). Only `forSale` photos are public and purchasable. |
| `createdAt`, `updatedAt` | string | |

**GSI `byCollection`**: PK `collectionId`, SK `sortOrder` (NUMBER).

**Rules**:
- Public APIs project only `id, thumbnailUrl, previewUrl, priceCents, width, height, photographerName`. `originalKey` never leaves the Lambda.
- **Replace original**: overwrite `originalKey` in place, write new `previewUrl`/`thumbnailUrl` with a new `{ts}`, then delete the old preview and thumbnail objects.
- **Delete** (admin, only for photos never sold): deletes the original, preview, thumbnail and record together. Photos that appear on any paid order can only be set to `removed`, so past buyers keep download access.

---

## Photographer — `connect-store-photographers`

Small table; listed with Scan.

| Field | Type | Notes |
|---|---|---|
| `id` | string (PK) | UUID |
| `name` | string | Shown as the photo credit |
| `email` | string | Contact only; photographers do not log in |
| `commissionPct` | number | 0–100, up to 2 decimal places |
| `active` | boolean | Inactive photographers cannot be assigned to new uploads; existing photos keep selling and paying them |
| `stripeAccountId` | string \| null | Express connected account (`acct_…`), created on the first **Send setup link** |
| `payoutsReady` | boolean | `capabilities.transfers === 'active' && payouts_enabled`, synced on demand (research R12) |
| `setupTokenHash` | string \| null | SHA-256 of the emailed setup-link token |
| `setupTokenExpiresAt` | string \| null | Send time + 30 days |
| `owedCents` | number | ≥ 0. Clawback that couldn't be reversed after a refund; deducted from future transfers (FR-030) |
| `createdAt`, `updatedAt` | string | |

**State**: `Setup not started` (no `stripeAccountId`) → `Setup pending` (account exists, `payoutsReady` false) → `Ready to be paid` (`payoutsReady` true). It can fall back to `Setup pending` if Stripe restricts the account.

---

## StoreOrder — `connect-store-orders`

Order lines are embedded (bounded by cart size; well under the 400 KB item limit).

| Field | Type | Notes |
|---|---|---|
| `id` | string (PK) | UUID; also sent to Stripe as `client_reference_id` |
| `entity` | `'ORDER'` | GSI partition key, set only once the order is `paid` |
| `status` | `'pending' \| 'paid' \| 'refunded'` | |
| `buyerEmail` | string | Lowercased |
| `lines` | `OrderLine[]` | See below |
| `subtotalCents` | number | Sum of list prices |
| `discountPct` | number | 0 if no tier applied |
| `discountCents` | number | |
| `totalCents` | number | `subtotalCents − discountCents` = Σ `lines.amountPaidCents` |
| `stripeSessionId` | string | |
| `stripePaymentIntentId` | string \| null | Set on fulfillment |
| `stripeChargeId` | string \| null | `latest_charge`; used as `source_transaction` for transfers and for refunds |
| `transfers` | `PhotographerTransfer[]` | One per photographer in the order; see below |
| `transferProblems` | boolean | True while any transfer is `failed` or `reversal_failed`; drives the admin warning badge |
| `siteUrl` | string | Validated origin, used for email links (research R9) |
| `downloadTokenHash` | string \| null | SHA-256 of the token secret; set on fulfillment and rotated on re-send |
| `downloadExpiresAt` | string \| null | Fulfillment or re-send time + 7 days |
| `createdAt` | string | Checkout start; GSI sort key |
| `paidAt` | string \| null | |
| `refundedAt` | string \| null | |
| `expiresAt` | number \| null | Epoch seconds, **DynamoDB TTL attribute**; set to +48h while `pending`, removed on `paid` |

**OrderLine**

| Field | Type | Notes |
|---|---|---|
| `photoId` | string | |
| `collectionId` | string | Supports the Orders event filter (FR-020) |
| `thumbnailUrl` | string | Snapshot for the admin view and email |
| `listPriceCents` | number | |
| `discountCents` | number | Proportional share (largest remainder; research R6) |
| `amountPaidCents` | number | `listPriceCents − discountCents` |
| `photographerId` | string | Snapshot at checkout |
| `commissionPct` | number | Snapshot at checkout (US5 scenario 5) |
| `commissionCents` | number | `round(amountPaidCents × commissionPct / 100)` |

**PhotographerTransfer** (embedded in the order; one per photographer per order)

| Field | Type | Notes |
|---|---|---|
| `photographerId` | string | |
| `commissionCents` | number | Σ `commissionCents` of that photographer's lines |
| `owedDeductedCents` | number | Portion of the photographer's prior `owedCents` recovered from this transfer |
| `amountCents` | number | `commissionCents − owedDeductedCents` (no transfer is created when this is 0) |
| `stripeTransferId` | string \| null | `tr_…` |
| `status` | `'sent' \| 'failed' \| 'reversed' \| 'reversal_failed' \| 'skipped'` | `skipped` = amount 0 after the owed deduction |
| `error` | string \| null | Last Stripe error message, shown to the admin |
| `reversedCents` | number | Amount actually reversed on refund |

**GSIs**:
- `byCreatedAt`: PK `entity`, SK `createdAt`. Admin Orders and Earnings date-range queries; pending orders are excluded because `entity` is set only when paid.
- `byEmail`: PK `buyerEmail`, SK `createdAt`. Re-send downloads.

**State transitions**:

```text
           checkout created          payment confirmed (webhook OR reconcile)
  (none) ───────────────────► pending ───────────────────────────────────► paid ──────► refunded
                                 │   conditional update: status = pending   │            admin Refund:
                                 │                                          │            Stripe refund, reverse transfers
                                 └── TTL 48h ──► deleted (abandoned)        │            (shortfall → photographer.owedCents),
                                                                            │            revoke download token
                                                       on paid: create one transfer per photographer
                                                       (failed → retryable by admin)
```

---

## Derived: Photographer earnings (FR-028)

Computed on request; nothing is stored. The Lambda queries `byCreatedAt` for all orders with `createdAt ≤ to` (full history, because refunds can land months after purchase; order volume is small) and aggregates in memory.

For the requested period `[from, to]`, per photographer:
- `photosSold` = count of lines on orders with `paidAt` in the period
- `grossSalesCents` = Σ `amountPaidCents` of those lines
- `earningsCents` = Σ `commissionCents` of those lines
- `sentCents` = Σ transfer `amountCents` with status `sent` or `reversed` for orders paid in the period
- `notSentCents` = Σ `commissionCents` of transfers with status `failed` (needs admin retry)
- `takenBackCents` = Σ `reversedCents` for orders refunded in the period
- `owedCents` = current value from the Photographer record

Stripe holds the authoritative record of money moved; these figures come from our order records and should match the photographer's Express dashboard.

---

## Validation rules (enforced in Lambda)

| Rule | Source |
|---|---|
| Price fields are integers ≥ 50 (Stripe minimum charge) | FR-004 |
| `commissionPct` between 0 and 100 | FR-026 |
| Original content types limited to `image/jpeg` and `image/png` | Edge case: non-image files |
| Checkout: 1–200 unique photo IDs, all `forSale` in `published` collections | FR-011, FR-013 |
| `buyerEmail` matches a basic email pattern, max 254 characters | FR-013 |
| `siteUrl` is on the environment allowlist | Research R9 |
