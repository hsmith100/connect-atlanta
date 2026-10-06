# UI Contract: Event Photo Store

**Feature**: 009-photo-store | **Date**: 2026-10-05

Static-export pages (Principle VII). All dynamic values come from query strings, because static export cannot pre-render dynamic path segments. All UI uses Tailwind and DaisyUI (Principle XI), with loading states and human-readable errors, and is usable at 320px or wider.

## Public pages

All visitor-facing store pages live under `/shop`, which replaces `/merch` (FR-008).

| Route | File | Purpose | Key behavior |
|---|---|---|---|
| `/shop` | `pages/shop/index.tsx` | Shop hub with two sections (FR-008) | Hero "Shop". **Merch** section: the existing `MerchGrid` and `MerchInfo` components moved as-is, labeled "Checkout on our merch store" (FR-008c). **Event Photos** section (`id="photos"`): card grid of published collections (cover thumbnail, title, date, photo count, photographer credit), labeled "Download full-resolution photos. Checkout right here." Empty state: "No event photos are on sale right now." Below the grid, a "Lost your download link?" link to `/shop/download`. If the collections request fails, only the photos section shows an error; merch still renders. |
| `/merch` | `pages/merch.tsx` | Redirect (FR-008a) | Replaced by a client-side redirect to `/shop` (`router.replace` plus a `<meta http-equiv="refresh">` fallback and a visible "Merch has moved to Shop" link). Client-side because the beatsontheblockfest.com CloudFront distribution isn't managed by CDK, so a CloudFront Function redirect wouldn't reach it. |
| `/shop/photos?event=` | `pages/shop/photos.tsx` | One event's photo grid and detail view (US2) | Thumbnail grid with infinite scroll (60 per page via `IntersectionObserver`). Clicking a photo opens a modal detail view with the watermarked `previewUrl`, price, photographer credit, Add/Remove cart toggle, previous/next buttons and ←/→ keys. Right-click on the preview is not blocked; the watermark is the protection. Back link to `/shop#photos`. |
| `/shop/cart` | `pages/shop/cart.tsx` | Cart and checkout (US3) | Page heading "Your Cart". Calls `cart/quote` on load and on every change. Shows per-photo price, a separate discount line, total, and a "Add N more photos to get X% off" nudge. Email field, license checkbox ("Personal use license — [terms]"), Turnstile widget, Checkout button with loading state. Handles 409 by removing photos and showing a notice. |
| `/shop/order?id=&session_id=` | `pages/shop/order.tsx` | Confirmation (US3) | Polls the order. When paid: "Thank you", total, a **Download your photos** button (to `/shop/download?token=`) and "We also emailed your links to x@y." When still pending after 30 seconds: reassurance message. |
| `/shop/download?token=` | `pages/shop/download.tsx` | Downloads (US3) | Lists purchased photos with thumbnail, filename and Download button. Shows the expiry date. With no token: only the re-send form, headed "Get a new download link." On 410 or 404: explanation plus the re-send form (email and Turnstile). |
| `/shop/photographer-setup?token=` | `pages/shop/photographer-setup.tsx` | Photographer bank setup (US5) | Intro text ("Connect your bank account to receive your share of photo sales"), Continue button that calls the API and redirects to Stripe onboarding. On return: syncs status and shows "You're all set" or "Stripe needs a bit more information" with a Continue button. On 410: "This link has expired — ask the organizer for a new one." Not linked from nav. |

**Navigation** (`components/layout/Header.tsx`): rename "Merch" to **"Shop"** (pointing to `/shop`) on desktop and mobile; no other nav changes. A cart icon with the item count appears in the header only while the photo cart is not empty, linking to `/shop/cart`.

**Gallery** (FR-008b):
- `pages/gallery.tsx`: banner below the hero, "See yourself? Buy full-resolution, watermark-free photos from our events", with a **Shop event photos** button to `/shop#photos`.
- `components/gallery/GalleryLightbox.tsx`: when the open photo's `eventId` matches a published collection (from the public collections list, which now includes `eventId`), show **Buy photos from this event** linking to `/shop/photos?event={collectionId}`. Collections are fetched once in parallel with gallery photos. If that fetch fails, the link is simply omitted.

**Footer/legal**: add a "Photo License" section to `pages/terms-conditions.tsx` (personal-use terms) and a "Request photo removal" link that goes to `/contact?subject=Photo%20removal` (FR-024).

## Admin: new "Store" tab in `pages/admin.tsx`

Sub-sections follow the `SubmissionsTab` sub-navigation pattern:

| Sub-section | Component | Behavior |
|---|---|---|
| Collections | `admin/store/CollectionsSection.tsx` + `CollectionDetail.tsx` | List with status badges; create from an existing event. Detail view: default price, default photographer, publish toggle (shows a `problems[]` list on 422), photo grid with multi-select actions (set price override, set photographer, hide, remove, delete, set cover), drag or arrow reorder. |
| Upload | `admin/store/StoreUploader.tsx` | Drag-and-drop or file picker (JPEG/PNG). Photographer selector (required). Per-file progress rows (Processing, Uploading, Done, Failed+Retry, Duplicate+Upload anyway). Overall "143 / 300" progress. Concurrency 3. Uses `lib/store/generateWatermarked.ts` for the preview and thumbnail. |
| Orders | `admin/store/OrdersSection.tsx` | Date and event filters, total revenue, table (date, email, photos, total, status, photographer-payment badge). Row actions: Re-send links, **Refund** (confirmation dialog states the amount and that photographer shares will be taken back), **Retry photographer payments** (shown only when a transfer failed). CSV export via `submissions/shared.ts` helpers. |
| Photographers | `admin/store/PhotographersSection.tsx` | CRUD list (name, email, commission %, active) with a payment status badge (Setup not started / Setup pending / Ready to be paid) and actions **Send setup link** and **Open their Stripe dashboard**. Earnings panel with date range: per-photographer earnings, sent, not sent, taken back, owed; CSV export (summary and per-sale). |
| Settings | `admin/store/StoreSettingsSection.tsx` | Discount tier editor (rows of min qty and % off) with validation messages. |
