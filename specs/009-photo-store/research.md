# Research: Event Photo Store

**Feature**: 009-photo-store | **Date**: 2026-10-05

All Technical Context unknowns are resolved below. Each entry: Decision / Rationale / Alternatives considered.

---

## R1. Where the photos are stored

**Decision**: Two storage locations per photo, linked by one `StorePhoto` record (FR-003a):

| Version | Location | Access |
|---|---|---|
| Full-quality original | **New** private S3 bucket `StoreOriginalsBucket` (BackendStack), key `originals/{photoId}.{ext}` | No CloudFront, `BLOCK_ALL`, `RETAIN`. Readable only by StoreLambda, which issues 15-minute pre-signed GET URLs to buyers holding a valid download token. |
| Watermarked preview (1600px) + thumbnail (600px) | Existing `MediaBucket`, keys `store/previews/{photoId}-{ts}.jpg` and `store/thumbs/{photoId}-{ts}.jpg` | Public through the existing media CloudFront distribution (Principle XII). |

**Rationale**: The existing media bucket grants its CloudFront OAI read access to the *whole* bucket, so any object there is publicly fetchable. Putting originals in a separate bucket with no distribution makes the "originals are never public" guarantee (FR-002, FR-011, SC-004) structural rather than dependent on key secrecy. The `-{ts}` suffix on previews busts the CloudFront cache when an original is replaced (same pattern as flyers).

**Alternatives considered**:
- *Originals under a private prefix of MediaBucket, scoping the OAI policy to other prefixes* — requires rewriting the existing bucket policy that serves gallery/flyers/hero cards; one mistake exposes originals. Rejected.
- *Third-party photo platforms (SmugMug, Pixieset, Shopify)* — would satisfy storage + sales out of the box, but cannot model the per-photographer commission ledger (FR-026–FR-030), breaks DynamoDB-as-source-of-truth (Principle IV), and takes users off-site. Rejected.

**Cost note**: ~10 GB of originals per event at S3 Standard ≈ $0.23/month/event. A lifecycle rule moves originals to Intelligent-Tiering after 30 days.

---

## R2. How the watermarked version is generated (FR-003)

**Decision**: Generated in the **admin's browser** during upload using the Canvas API, extending the existing `frontend/lib/generateThumbnail.ts` pattern. For each file the admin page:

1. Decodes the original with `createImageBitmap` (memory-efficient for 25 MB+ files).
2. Draws a 1600px long-edge preview and a 600px thumbnail, each overlaid with a tiled diagonal "BEATS ON THE BLOCK" watermark (white at 30% opacity with a 15% dark stroke, so it shows on both light and dark photos).
3. Requests pre-signed PUT URLs for all three objects, then uploads the original (to the private bucket) plus preview and thumbnail (to the media bucket) directly from the browser.
4. Creates the `StorePhoto` record only after all three uploads succeed, so a photo never exists without its preview.

Uploads run with a concurrency of 3 to bound browser memory.

**Rationale**: No new runtime dependency or native binary; follows the established direct-to-S3 pre-signed upload pattern; nothing passes through Lambda's 6 MB payload limit. The admin is the trust boundary, so client-side generation is safe. The admin never makes or uploads watermarked files themselves (clarification Q4).

**Alternatives considered**:
- *Server-side generation with `sharp` in a Lambda triggered by S3 upload* — needs a Linux ARM native binary bundled without Docker (unavailable on the dev machine), adds an S3 event pipeline and async "processing" states. Rejected for Simplicity First; revisit only if browser generation proves too slow.
- *CloudFront image transformation / Lambda@Edge* — new managed service and per-request cost. Rejected.

**Failure handling**: A file that fails to decode or upload is listed in the upload panel with its reason and a **Retry** button (the file remains in browser memory). It never creates a record, so it can never appear in the store without a preview.

**Duplicates**: The browser computes a SHA-256 of each file (`crypto.subtle.digest`), stored as `contentHash`. Files whose hash already exists in the collection are flagged and skipped unless the admin confirms.

---

## R3. Payment provider (FR-013, FR-014, FR-029)

**Decision**: **Stripe Checkout** (hosted payment page) with **Stripe Connect** for automatic photographer payments (R12), via the `stripe` Node SDK in Lambda. Approved by the organizer on 2026-10-05.

**Rationale**:
- Only option evaluated that can **split one purchase across several photographers and pay each automatically** (FR-029), which was the deciding requirement.
- Hosted Checkout keeps card data entirely off our site (PCI SAQ-A), supports Apple Pay and Google Pay, and issues receipts.
- The organization's existing event POS (Rebelity) already processes through Stripe, so this keeps one payment company across events and the website.
- Per-transaction pricing only (2.9% + 30¢); no monthly platform fee for the organization itself.

**Alternatives considered**:

| Option | Fees on a $15 photo | Automatic photographer split | Verdict |
|---|---|---|---|
| **Stripe + Connect** | ≈ $0.74 + Connect fees (R12) | Yes, built for multi-party splits | **Chosen** |
| Rebelity (current event POS) | ≈ $0.74 Stripe + $0.99 + 2% platform fee ≈ $2.03 | Not offered | Rejected: event ticketing/POS platform; no documented online store, digital downloads, API, or revenue split |
| Square | Similar to Stripe | No built-in split to third parties | Rejected |
| PayPal | ≈ 3.5% + 49¢ ≈ $1.01 | Bulk payouts must be triggered manually | Rejected |
| Raw Stripe REST via `fetch` (no SDK) | n/a | n/a | Rejected: hand-rolled form encoding and HMAC verification add more code and risk than the dependency |

Sources: Rebelity fee page (rebelity.net/online-ticket-sales), Stripe Connect pricing (stripe.com/connect/pricing).

**⚠ Constitution Principle I**: Stripe is a new external service and is recorded in plan.md Complexity Tracking. It cannot be avoided, because FR-014 requires a PCI-compliant provider.

---

## R4. Fulfillment reliability (FR-015, FR-018)

**Decision**: Two idempotent paths into the same `fulfillOrder(orderId)` function:

1. **Stripe webhook** `checkout.session.completed` → `POST /api/store/stripe-webhook` (pointed at the API Gateway URL directly, bypassing CloudFront).
2. **Confirmation-page reconcile**: `GET /api/store/orders/{id}?session_id=…`. If the order is still `pending`, the Lambda retrieves the Checkout Session from Stripe and fulfills it when `payment_status === 'paid'`.

`fulfillOrder` uses a DynamoDB conditional update (`status = pending → paid`), so whichever path arrives second is a no-op. Only the path that wins the condition sends emails and creates photographer transfers (R12). Transfers also use Stripe idempotency keys (`{orderId}:{photographerId}`), so a Lambda retry can never pay twice.

Checkout is limited to `payment_method_types: ['card']` (Apple Pay and Google Pay are included under card). This excludes delayed-settlement methods such as ACH, which Stripe warns can fail after a transfer has already been sent.

**Rationale**: The webhook covers buyers who close the browser (FR-018). The reconcile path covers webhook delays and per-PR ephemeral environments, which have no registered webhook endpoint.

**Abandoned checkouts**: Pending orders carry an `expiresAt` attribute with DynamoDB TTL at 48 hours, so they are deleted automatically. No cleanup job is needed.

---

## R5. Download links that last 7 days (FR-017)

**Decision**: The email and confirmation page link to `/shop/download?token={orderId}.{secret}`. `secret` is 32 random bytes (base64url); only its SHA-256 hash and `downloadExpiresAt` are stored on the order. `GET /api/store/downloads/{token}` validates the hash, expiry and `status === 'paid'`, then returns a 15-minute pre-signed S3 GET URL per photo with `Content-Disposition: attachment`.

**Rationale**: S3 pre-signed URLs signed with Lambda role credentials expire when the role session does (hours), so they cannot be used as 7-day links directly. A token we control also makes revocation on refund (FR-021) and rotation on re-send immediate.

**Re-send (US3 scenario 6)**: `POST /api/store/orders/resend {email, turnstileToken}` rotates the token on every paid order for that email, extends the expiry 7 days, and emails the links. It always returns 200 to prevent email enumeration, and is protected by the existing Turnstile verification (`lib/turnstile.ts`) against email bombing.

---

## R6. Volume discounts and per-photographer allocation (FR-031–FR-034, FR-027)

**Decision**: One pure function in `lambda/src/lib/storePricing.ts` is the only pricing authority:

1. Look up current prices (photo override ?? collection default), in integer **cents**.
2. Pick the highest tier whose `minQty ≤ photoCount` (count across all events).
3. `discountCents = round(subtotal × pct / 100)`.
4. Allocate the discount to lines in proportion to price using the **largest-remainder method**, so line `amountPaidCents` values sum exactly to the order total (SC-007 "to the cent").
5. `commissionCents = round(amountPaidCents × commissionPct / 100)` per line, snapshotting `photographerId` and `commissionPct` at checkout time.

The cart page calls `POST /api/store/cart/quote` for display (subtotal, tier, discount line, "N more photos unlock X% off"). Checkout re-runs the same function server-side, so the client never supplies prices.

**Stripe representation**: Line items at full list price, plus a one-off Stripe coupon (`amount_off = discountCents`, `max_redemptions: 1`) created per Checkout Session. The discount therefore shows as its own line on Stripe's page and receipt (FR-034).

**Default tiers** (stored in a settings item and editable in admin): 3+ = 15%, 5+ = 25%, 10+ = 35%.

---

## R7. Sales tax

**Decision**: No sales tax is collected at launch. Georgia generally does not tax specified digital products such as downloaded images. The Checkout Session is built so that `automatic_tax: { enabled: true }` (Stripe Tax) can be switched on later without code restructuring.

**Action**: The organizer should confirm with their accountant before launch. This is not blocking for implementation.

---

## R8. Secrets and per-environment Stripe configuration

**Decision**: A `StripeSecret` in Secrets Manager holding JSON `{ "secretKey": "...", "webhookSecret": "..." }`, populated manually after deploy (same procedure as the Turnstile secret):

| Env | Keys |
|---|---|
| prod | Stripe **live** keys + live webhook secret (Connect must be enabled on the live account) |
| staging | Stripe **test** keys + test webhook secret |
| dev | Stripe **test** keys; secret owned by `ConnectDevBackendStack`, named `connect-dev-stripe` |
| PR (ephemeral) | Imports `connect-dev-stripe` by name (no webhook; fulfillment uses the R4 reconcile path) |

When the secret still holds the CDK-generated placeholder (no `sk_` prefix), checkout returns 503 "Store checkout is not available yet". Browsing still works.

---

## R9. Site URL for redirects and email links (no circular stack dependency)

**Decision**: The browser sends `window.location.origin` as `siteUrl` with the checkout request. The Lambda validates it against an allowlist: the four prod/www domains in prod, and the CloudFront domain pattern in staging, dev and ephemeral envs. It stores the value on the order and uses it for Stripe `success_url`/`cancel_url` and email links.

**Rationale**: FrontendStack depends on BackendStack, so BackendStack cannot read the site's CloudFront domain without a circular reference. The allowlist prevents open-redirect abuse.

---

## R10. Data volume and access patterns

- ~300–500 photos per event and a handful of events per year: thousands of `StorePhoto` items, not millions.
- Orders: tens to low hundreds per event. Earnings and orders admin views query the `byCreatedAt` GSI for a date range and aggregate in Lambda. No precomputed totals are needed (YAGNI).
- Public collection grid: queries the `byCollection` GSI (sorted by `sortOrder`) with 60-item pages and `nextCursor`, rendered as thumbnails with infinite scroll (SC-002, Principle XII).

---

## R11. Cart persistence (FR-012)

**Decision**: A React context (`StoreCartProvider` in `_app.tsx`) persists `{photoId, collectionId, thumbnailUrl}` to `localStorage`, wrapped in try/catch. Prices are never stored client-side; the cart page always re-quotes (R6), so stale prices and removed photos are caught. A photo that is unavailable at quote or checkout time is removed with a visible notice (US6 scenario 2).

---

## R12. Automatic photographer payments: Stripe Connect design (FR-029–FR-030)

**Decision**: Each photographer is an **Express connected account** with only the `transfers` capability. Payments use Stripe's **separate charges and transfers** pattern:

1. **Setup (once per photographer)**: the admin clicks **Send setup link**. The Lambda creates the Express account (if none exists), stores `stripeAccountId`, and emails the photographer a link to `/shop/photographer-setup?token=…`. That page calls our API, which mints a fresh Stripe Account Link (these are single-use and expire within minutes) and redirects to Stripe's hosted onboarding, where the photographer enters identity and bank details. **The site never sees bank details.** Our setup token is stored hashed and is valid for 30 days; the admin can re-send at any time.
2. **Status sync**: no Connect webhook. The Lambda calls `accounts.retrieve` (a) when the photographer returns from onboarding, (b) when the admin opens Photographers (for accounts not yet ready), and (c) at publish time. It stores `payoutsReady = capabilities.transfers === 'active' && payouts_enabled`. A second webhook endpoint (Connect events use their own signing secret) isn't worth adding for a few photographers.
3. **Publish gate (FR-029a)**: a collection can't be published while any `forSale` photo belongs to a photographer whose `payoutsReady` is false.
4. **On payment**: the Checkout Session sets `payment_intent_data.transfer_group = orderId`. `fulfillOrder` groups order lines by photographer and creates **one transfer per photographer per order**: `amount = Σ commissionCents − deduction for owed clawback`, `destination = stripeAccountId`, `source_transaction = latest_charge`, `transfer_group = orderId`. Using `source_transaction`, the transfer always succeeds even before the charge settles, and Stripe releases the funds to the photographer when the charge's funds become available.
5. **Deposits**: connected accounts are created with a **weekly** payout schedule. Stripe deposits each photographer's accumulated balance to their bank automatically, which keeps per-payout fees low.
6. **Refunds (FR-030)**: the admin clicks **Refund** in Orders. The Lambda creates the Stripe refund, reverses each of that order's transfers, revokes downloads, and marks the order refunded. Per Stripe, refunding a charge does **not** affect its transfers, and a reversal only succeeds if the photographer's Stripe balance covers it. If a reversal fails (money already deposited to their bank), the shortfall is added to the photographer's `owedCents` and deducted from their next transfers. That is Stripe's recommended pattern of reducing subsequent transfer amounts.
7. **Failures (FR-029b)**: if a transfer call fails (e.g., the account became restricted), the order still completes, the lines are marked `transferStatus: 'failed'` with the error, the organizer gets an email, and the admin can **Retry** from Orders.
8. **Photographer visibility**: the admin can generate a Stripe Express dashboard login link for a photographer, where they see every payment and deposit.

**Cost** (organization pays; the platform handles pricing because the organization is the seller of record):
- $2 per photographer per month in which they receive a deposit
- 0.25% + 25¢ per deposit
- Example: a photographer earning $400 in a month with 4 weekly deposits ≈ $2 + 4 × $0.50 = **$4.00**

**Liability**: under separate charges and transfers, the organization covers negative balances, such as a chargeback after the photographer has been paid. `owedCents` makes this visible and recovers it from future shares.

**Tax forms**: Stripe can e-file 1099s for connected accounts ($2.99 per IRS e-file, plus state fees) through its dashboard. This is configured by the organizer outside this feature.

**Alternatives considered**:
- *Destination charges* (one connected account per payment): cannot split one cart across multiple photographers. Rejected.
- *Manual payouts recorded in admin* (previous design): rejected by the organizer in favor of automation.
- *Standard connected accounts*: photographers would need full Stripe accounts and could see platform-level data. Express is the hosted, lightweight option intended for this use case.
- *Connect webhook for `account.updated`*: unnecessary at this scale; on-demand sync covers it.

**Sources**: docs.stripe.com/connect/separate-charges-and-transfers; stripe.com/connect/pricing.
