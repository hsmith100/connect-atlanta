# API Contract: Event Photo Store

**Feature**: 009-photo-store | **Date**: 2026-10-05

All routes are served by the new **StoreLambda** (`lambda/src/handlers/store.ts` router) on the existing HTTP API. Conventions match the existing API:

- JSON request and response bodies; errors are `{ "error": "<human-readable message>" }`.
- Admin routes require the `x-admin-key` header (`requireAdmin`, Principle V) and return 401 without it.
- Money is integer cents. Request and response types live in `shared/types/store.ts`.
- Stage-level throttling (20 rps, burst 50) applies to all routes.

---

## Public routes

### `GET /api/gallery`
*Moved from PhotosLambda to StoreLambda (research R13); same response shape as today.* Photos with `inGallery && !removed`, in `gallerySortOrder`, from the sparse `byGallery` index.

**200**
```json
{ "photos": [ { "id": "p1", "url": "https://media.../library/web/p1-171.jpg",
                "thumbnailUrl": "https://media.../library/web-thumbs/p1-171.jpg",
                "eventId": "e1", "sortOrder": 10, "visible": true } ] }
```
`url` is the clean ~2000px web version, never the original.

### `GET /api/store/collections`
Published collections, newest event first (FR-009). `photoCount` here is the collection's `forSaleCount`. Used by the Shop page's Event Photos section and by the Gallery lightbox to map `eventId` to a collection (FR-008b).

**200**
```json
{ "collections": [
  { "id": "c1", "eventId": "e1", "title": "Beats on the Block — Aug 2026", "eventDate": "2026-08-15",
    "coverThumbnailUrl": "https://media.../store/thumbs/p1-171.jpg",
    "photoCount": 412, "photographerNames": ["Jay Ortiz"] }
] }
```

### `GET /api/store/collections/{id}?cursor=<opaque>`
One published collection page of 60 for-sale photos (`forSale && !removed`) in `sortOrder` (FR-010).

**200**
```json
{ "collection": { "id": "c1", "title": "...", "eventDate": "2026-08-15", "photoCount": 412 },
  "photos": [
    { "id": "p1", "thumbnailUrl": "...", "previewUrl": "...", "width": 6000, "height": 4000,
      "priceCents": 1500, "photographerName": "Jay Ortiz" }
  ],
  "nextCursor": "eyJ..." }
```
**404**: collection missing or not published.
Never returns `originalKey` or any private-bucket reference (FR-011).

### `POST /api/store/cart/quote`
Server-authoritative pricing for the cart page (FR-032–FR-034).

**Request**: `{ "photoIds": ["p1", "p2", "p3"] }` (1–200 unique)

**200**
```json
{ "lines": [ { "photoId": "p1", "thumbnailUrl": "...", "collectionTitle": "...", "listPriceCents": 1500 } ],
  "unavailablePhotoIds": ["p9"],
  "subtotalCents": 4500, "discountPct": 15, "discountCents": 675, "totalCents": 3825,
  "nextTier": { "photosNeeded": 2, "pctOff": 25 } }
```
`nextTier` is `null` when the highest tier already applies. Unavailable photos (removed, not for sale, or in an unpublished collection) are excluded from all totals.

### `POST /api/store/checkout`
Creates a pending order and a Stripe Checkout Session (FR-013, FR-015).

**Request**
```json
{ "photoIds": ["p1", "p2", "p3"], "email": "buyer@example.com",
  "siteUrl": "https://beatsontheblockfest.com", "acceptedLicense": true, "turnstileToken": "..." }
```
**200**: `{ "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_..." }`. The browser redirects to it.
**409**: `{ "error": "Some photos are no longer available", "unavailablePhotoIds": ["p9"] }`. The client removes them, shows a notice, and the buyer re-submits (US6 scenario 2).
**400**: invalid email, empty cart, `acceptedLicense` not true, `siteUrl` not on the allowlist, or Turnstile verification failed ("Please complete the verification and try again"). Turnstile is verified before any DynamoDB or Stripe write.
**503**: Stripe secret not configured for this environment.

Stripe session settings: `mode: payment`, `payment_method_types: ['card']`, `payment_intent_data.transfer_group = orderId`, `customer_email`, `client_reference_id = orderId`, one line item per photo at list price (product name = collection title + photo number, image = thumbnail), plus a one-off coupon for the discount; `success_url = {siteUrl}/shop/order?id={orderId}&session_id={CHECKOUT_SESSION_ID}`; `cancel_url = {siteUrl}/shop/cart`.

### `GET /api/store/orders/{id}?session_id=cs_...`
Confirmation page polling and reconcile path (research R4). `session_id` must match `order.stripeSessionId`; otherwise **404**. If the order is `pending`, the Lambda retrieves the session from Stripe and fulfills it when paid.

**200**
```json
{ "status": "paid", "email": "buyer@example.com", "totalCents": 3825, "discountCents": 675,
  "lineCount": 3, "downloadToken": "o1.Zm9v..." }
```
`downloadToken` is present only when `status === 'paid'` and `paidAt` is within the last 15 minutes. If this call didn't create the token itself (the webhook fulfilled first), it generates a new token and **appends** its hash to `downloadTokenHashes` (keeping the newest 5), so the emailed link stays valid. After that, buyers use the email link or re-send, so a leaked session URL does not grant downloads indefinitely. `status: "pending"` tells the client to poll again in 2 seconds (up to 30 seconds), then show "We're confirming your payment — you'll get an email shortly."

### `GET /api/store/downloads/{token}`
Download page data (FR-016, FR-017).

**200**
```json
{ "orderId": "o1", "expiresAt": "2026-10-12T18:00:00Z",
  "items": [ { "photoId": "p1", "thumbnailUrl": "...", "filename": "IMG_0412.jpg",
               "downloadUrl": "https://<private-bucket>.s3...&X-Amz-Expires=900" } ] }
```
**410**: `{ "error": "This download link has expired. Request a new one below." }` when the token is valid but past `downloadExpiresAt`.
**404**: invalid token (hash not in `downloadTokenHashes`), replaced token, or refunded order.

### `POST /api/store/orders/resend`
**Request**: `{ "email": "buyer@example.com", "turnstileToken": "..." }`
**200**: always `{ "ok": true }` (no enumeration). For each paid order with that email, the Lambda replaces `downloadTokenHashes` with one new token, sets expiry to +7 days, and emails the links.
**400**: Turnstile verification failed.

### `POST /api/store/stripe-webhook`
Stripe → Lambda. The raw body (base64-decoded when `isBase64Encoded`) is verified with `stripe.webhooks.constructEvent` against the `Stripe-Signature` header and `webhookSecret`.
Handles `checkout.session.completed`: `fulfillOrder(client_reference_id)`, which marks the order paid, creates photographer transfers (research R12) and sends emails. Other event types return 200 and are ignored.
**400**: signature invalid. **200**: processed or ignored. Fulfillment is idempotent.

---

## Admin routes (`x-admin-key` required)

### Photo library: collections (one per event)
Served by StoreLambda under `/api/admin/library/*` (research R13). These screens live in the admin **Photos** tab.

| Method & path | Body | Response |
|---|---|---|
| `GET /api/admin/library/collections` | | `{ collections: PhotoCollection[] }` (all statuses) |
| `POST /api/admin/library/collections` | `{ eventId, defaultPriceCents, defaultPhotographerId? }` | `201 PhotoCollection`; `409` if the event already has one |
| `PATCH /api/admin/library/collections/{id}` | any of `{ title, defaultPriceCents, defaultPhotographerId, coverPhotoId, status }` | `200 PhotoCollection`; `422 { error, problems: string[] }` when store-publish preconditions fail |
| `DELETE /api/admin/library/collections/{id}` | | `200 { deleted: true }`; `409` while the collection still has photos |

### Photo library: photos
| Method & path | Body | Response |
|---|---|---|
| `GET /api/admin/library/collections/{id}/photos` | | `{ photos: LibraryPhoto[] }` (including removed; full list, no paging) |
| `GET /api/admin/library/gallery` | | `{ photos: LibraryPhoto[] }`: all photos currently in the Gallery, in gallery order, for the gallery-order view |
| `POST /api/admin/library/photos/presign` | `[{ id, filename, contentType, bytes }]` (≤ 50 per call) | `[{ id, originalUploadUrl, webUploadUrl, webThumbUploadUrl, previewUploadUrl, thumbUploadUrl, webUrl, webThumbUrl, previewUrl, thumbnailUrl, originalKey }]`, PUT URLs valid 15 min |
| `POST /api/admin/library/photos` | `[{ id, collectionId, originalKey, originalFilename, originalBytes, width, height, contentHash, webUrl, webThumbUrl, previewUrl, thumbnailUrl, photographerId, sortOrder, forSale, inGallery }]` | `201 { created: n }`. Validates that the original object exists (`HeadObject`) before writing (FR-003a). `photographerId` is required when `forSale` is true. New gallery photos go to the end of the gallery order. |
| `PATCH /api/admin/library/photos` | `[{ id, sortOrder?, gallerySortOrder?, forSale?, inGallery?, removed?, priceOverrideCents?, photographerId? }]` | `200 { updated: n }`. Keeps `galleryKey`, `photoCount` and `forSaleCount` in sync; `400` if `forSale: true` on a photo with no photographer |
| `POST /api/admin/library/photos/{id}/replace` | `{ filename, contentType, bytes }` | Presigned URLs as above for the same `id` |
| `PATCH /api/admin/library/photos/{id}/replace` | `{ originalKey, webUrl, webThumbUrl, previewUrl, thumbnailUrl, width, height, contentHash, originalFilename, originalBytes }` | `200 LibraryPhoto`; deletes superseded public objects |
| `DELETE /api/admin/library/photos` | `{ ids: string[] }` | `200 { deleted: n, skipped: [{ id, reason: "sold" }] }` |

### Photographers and earnings
| Method & path | Body | Response |
|---|---|---|
| `GET /api/admin/store/photographers` | | `{ photographers: Photographer[] }`. Refreshes `payoutsReady` from Stripe for photographers not yet ready. Never returns token hashes. |
| `POST /api/admin/store/photographers` | `{ name, email, commissionPct }` | `201 Photographer` |
| `PATCH /api/admin/store/photographers/{id}` | any of `{ name, email, commissionPct, active }` | `200 Photographer` |
| `POST /api/admin/store/photographers/{id}/setup-link` | | `200 { ok: true }`. Creates the Express account if missing (weekly payout schedule, `transfers` capability), rotates the setup token (30 days), emails the photographer. |
| `POST /api/admin/store/photographers/{id}/dashboard-link` | | `200 { url }`: a single-use Stripe Express dashboard login link the admin can share |
| `GET /api/admin/store/earnings?from=YYYY-MM-DD&to=YYYY-MM-DD` | | `{ from, to, photographers: [{ photographerId, name, commissionPct, payoutsReady, photosSold, grossSalesCents, earningsCents, sentCents, notSentCents, takenBackCents, owedCents }], sales: [{ orderId, paidAt, photoId, photographerId, amountPaidCents, commissionPct, commissionCents, transferStatus }] }`. `sales` feeds the per-sale CSV export (US5 scenario 5). |

### Photographer setup (public, token-protected)
| Method & path | Body | Response |
|---|---|---|
| `POST /api/store/photographer-setup` | `{ token, siteUrl }` | `200 { url }`: a fresh Stripe Account Link (`type: account_onboarding`, `refresh_url` and `return_url` on `{siteUrl}/shop/photographer-setup`); the page redirects to it. `404` invalid token; `410` expired token ("Ask the organizer for a new link"). |
| `POST /api/store/photographer-setup/complete` | `{ token }` | `200 { ready: boolean }`: syncs `payoutsReady` from Stripe after the photographer returns |

### Orders
| Method & path | Body | Response |
|---|---|---|
| `GET /api/admin/store/orders?from&to&collectionId` | | `{ orders: StoreOrder[], totalRevenueCents }` (paid and refunded, newest first; never includes `downloadTokenHashes`) |
| `POST /api/admin/store/orders/{id}/resend` | | `200 { ok: true }`; replaces `downloadTokenHashes` with one new token and emails the buyer (FR-021) |
| `POST /api/admin/store/orders/{id}/refund` | | `200 StoreOrder`. Full refund: creates the Stripe refund on `stripeChargeId`, reverses each `sent` transfer (any shortfall goes to `photographer.owedCents`, status `reversal_failed`), clears `downloadTokenHashes`, and sets `status: refunded`. Idempotent: Stripe idempotency key `refund:{orderId}`, and the order-status condition. |
| `POST /api/admin/store/orders/{id}/retry-transfers` | | `200 StoreOrder`; retries every `failed` transfer (same idempotency keys) |

### Settings
| Method & path | Body | Response |
|---|---|---|
| `GET /api/admin/store/settings` | | `{ discountTiers }` |
| `PUT /api/admin/store/settings` | `{ discountTiers: [{ minQty, pctOff }] }` | `200 { discountTiers }`; `400` on validation failure (data-model.md) |

The public `cart/quote` reads tiers from the same settings item.

---

## Emails (SES, from `noreply@beatsontheblockfest.com`)

| Trigger | To | Content |
|---|---|---|
| Order fulfilled | Buyer | Order summary with each photo, list price, discount line and total; download link `{siteUrl}/shop/download?token=…` with expiry date; personal-use license terms (FR-023); re-send instructions |
| Order fulfilled | `CONTACT_EMAIL` (organizer) | Buyer email, photo count, total, admin link (FR-022); a warning section if any photographer transfer failed |
| Setup link sent | Photographer | Explanation of the commission arrangement, setup link (valid 30 days), note that bank details are entered on Stripe's secure page |
| Re-send (buyer or admin) | Buyer | Fresh download links and new expiry date |
