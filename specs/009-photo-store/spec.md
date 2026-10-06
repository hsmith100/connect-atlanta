# Feature Specification: Event Photo Store

**Feature Branch**: `009-photo-store`  
**Created**: 2026-10-05  
**Status**: Draft  
**Input**: User description: "We have a need to setup a store on our website so that users who visit have the ability to buy pictures. We have a bunch of picutures, so I need to know where to store them and ultimately an ability to show and sell them on our website"

## Clarifications

### Session 2026-10-05

- Q: What are we selling — digital downloads, physical prints, or both? → A: Digital downloads only.
- Q: Who takes the photos and how is revenue handled? → A: Outside photographers, who are credited and earn a percentage of each sale of their photos.
- Q: How should pricing work? → A: Per-photo pricing plus automatic volume discounts (e.g., 3+ photos get a percentage off).
- Q: Who creates the watermarked version of each photo? → A: Admins upload only the full-quality photo; the system automatically creates the watermarked, lower-quality preview and permanently links it to its original.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Uploads and Prices Photos for Sale (Priority: P1)

An organizer has a large batch of event photos (hundreds per event). They sign in to the existing admin area, choose an event, and bulk-upload the full-resolution photos. Admins upload only the full-quality photos. For each one, the system automatically creates a watermarked, lower-quality preview that visitors browse publicly, and links the preview to its full-quality original so a purchase of the preview delivers the matching original. Only the full-quality original is kept private. The organizer sets a default price for the event's photos, can override the price on individual photos, and marks the collection as "for sale" when ready.

**Why this priority**: Nothing can be shown or sold until photos are stored safely and priced. This also answers the core "where do the pictures live" question: originals are kept privately and never exposed until purchased.

**Independent Test**: Upload a batch of photos for one event through the admin area, assign a photographer, confirm previews are generated and watermarked, confirm the originals cannot be reached by any public link, and confirm prices are saved.

**Acceptance Scenarios**:

1. **Given** an authenticated admin, **When** they upload 200 full-quality photos to an event's sale collection, **Then** all 200 are stored, each gets an automatically generated watermarked preview linked to it, and upload progress and any per-file failures are shown.
2. **Given** a stored photo, **When** anyone requests it via a public page or guessed URL, **Then** only the watermarked preview is reachable; the full-resolution original is not.
3. **Given** an event collection, **When** the admin sets a default price and overrides one photo's price, **Then** the overridden photo shows its own price and all others show the default.
4. **Given** an upload batch, **When** the admin assigns the photographer who took it, **Then** every photo in the batch is attributed to that photographer and their name appears as the credit.
5. **Given** a collection marked "not for sale" (draft), **When** a visitor browses the store, **Then** that collection is not visible.

---

### User Story 2 - Visitor Browses and Finds Their Photos (Priority: P1)

A visitor who attended an event comes to the site's photo store, picks the event they attended, and scrolls through a fast-loading grid of watermarked previews. They can open any photo in a larger view to see detail and the price.

**Why this priority**: Shoppers must be able to find photos of themselves quickly; with hundreds of photos per event, browsing by event is the minimum for a usable store.

**Independent Test**: With one published collection, open the store, select the event, browse the grid, and open a photo's detail view showing a watermarked image and its price.

**Acceptance Scenarios**:

1. **Given** published collections exist, **When** a visitor opens the store, **Then** they see the events that have photos for sale, each with a cover image, event name, date, and photo count.
2. **Given** a visitor selects an event, **When** the collection loads, **Then** previews display in a grid that loads progressively as they scroll.
3. **Given** a visitor clicks a preview, **When** the detail view opens, **Then** they see a larger watermarked image, the price, and an "Add to cart" action, and can move to the previous/next photo.
4. **Given** a visitor on a phone, **When** they browse, **Then** the grid and detail view are fully usable at mobile widths.

---

### User Story 3 - Visitor Purchases and Receives Photos (Priority: P1)

A visitor adds one or more photos to a cart, reviews the cart, and checks out by entering their email and payment details. After payment succeeds, they see a confirmation and receive an email with links to download the full-resolution, unwatermarked photos they bought.

**Why this priority**: This is the revenue-generating step; without it the store is only a gallery.

**Independent Test**: Add two photos to the cart, complete checkout with a test payment, and confirm the confirmation page and email both provide working download links to the unwatermarked originals.

**Acceptance Scenarios**:

1. **Given** photos in the cart, **When** the visitor views the cart, **Then** they see each photo thumbnail, its price, a remove option, any volume discount applied, and the order total.
2. **Given** the cart qualifies for a volume discount tier, **When** the visitor views the cart, **Then** the discount is applied automatically and shown as its own line; **Given** the cart is one photo short of the next tier, **Then** the cart tells them how many more photos unlock it.
3. **Given** a valid payment, **When** checkout completes, **Then** the visitor sees an order confirmation and receives a confirmation email within 5 minutes containing download links for every purchased photo.
4. **Given** a declined payment, **When** checkout is attempted, **Then** no order is fulfilled, no download access is granted, and the visitor sees a clear message and can retry.
5. **Given** a purchase download link, **When** it is opened, **Then** the visitor receives the full-resolution, unwatermarked original.
6. **Given** a buyer lost their email, **When** they request their downloads be re-sent using their order email, **Then** a new email with valid download links is sent to that address only.

---

### User Story 4 - Admin Views Orders and Sales (Priority: P2)

The organizer opens an "Orders" view in the admin area to see every completed order — buyer email, photos purchased, amount, and date — filter by date range and event, and export the list to a spreadsheet. They can re-send download links to a buyer who asks for help.

**Why this priority**: Needed to run the store (customer support, reconciliation), but buyers can purchase without it.

**Independent Test**: After placing test orders, open the Orders view, filter by date, export to CSV, and re-send a download email.

**Acceptance Scenarios**:

1. **Given** completed orders, **When** the admin opens Orders, **Then** they see each order with buyer email, items, total, status, and date, newest first.
2. **Given** a date range and event filter, **When** applied, **Then** only matching orders and their total revenue are shown.
3. **Given** the filtered list, **When** the admin exports, **Then** a CSV of the visible orders downloads (matching the existing admin Submissions export behavior).

---

### User Story 5 - Admin Tracks and Records Photographer Payouts (Priority: P2)

The organizer manages a roster of outside photographers, each with a commission percentage. For any date range they open a Photographer Earnings view that shows, per photographer, photos sold, gross sales attributed, and the amount owed. After paying a photographer (outside the system), the organizer records the payout so the outstanding balance drops to zero.

**Why this priority**: Photographers must be paid accurately and on time to keep contributing, but sales can launch before the first payout cycle.

**Independent Test**: Create two photographers with different commission rates, sell photos from each, open Photographer Earnings, verify amounts owed, record a payout, and confirm the balance updates.

**Acceptance Scenarios**:

1. **Given** an admin, **When** they add a photographer with name, contact email, and commission percentage, **Then** that photographer can be assigned to uploaded photos.
2. **Given** completed orders, **When** the admin opens Photographer Earnings for a date range, **Then** each photographer's earnings equal the sum of (amount actually paid for each of their photos after discounts) × (their commission percentage at time of sale).
3. **Given** an outstanding balance, **When** the admin records a payout with amount, date, and note, **Then** the outstanding balance is reduced by that amount and the payout appears in the photographer's history.
4. **Given** the earnings view, **When** the admin exports, **Then** a CSV with per-photographer and per-sale detail downloads.
5. **Given** a photographer's commission percentage is changed, **When** earnings are viewed, **Then** past sales keep the percentage that applied when they were sold.

---

### User Story 6 - Admin Removes a Photo on Request (Priority: P2)

An attendee asks that a photo of them be taken down. The organizer finds the photo in the admin area and removes it from sale; it immediately disappears from the public store.

**Why this priority**: Selling images of people requires a fast takedown path to protect attendees and the brand.

**Independent Test**: Remove a published photo and confirm it no longer appears in the store or can be added to a cart.

**Acceptance Scenarios**:

1. **Given** a photo for sale, **When** the admin removes it from sale, **Then** it is no longer visible in the store and cannot be purchased.
2. **Given** a removed photo already in a visitor's cart, **When** they check out, **Then** it is dropped from the order with a notice and they are not charged for it.

---

### Edge Cases

- A visitor buys the same photo twice → allowed; each order is independent (or the system warns them it is already purchased with that email — warning only, not a block).
- Download link expires before the buyer uses it → buyer can request a re-send from the confirmation email/page or via the admin.
- Payment succeeds but the confirmation email fails to send → order is still recorded as paid and downloads remain available from the confirmation page; admin can re-send.
- Payment is charged but the visitor closes the browser before the confirmation page → order is still fulfilled and the email is still sent.
- Admin uploads a non-image or corrupt file → that file is rejected with a reason; the rest of the batch continues.
- Admin uploads a duplicate file to the same collection → flagged as a duplicate and skipped unless the admin confirms.
- A collection is unpublished while a visitor is browsing → photos already in the cart can no longer be purchased and are removed at checkout with a notice.
- Refund issued for an order → download access for that order is revoked and the photographer earnings from it are reversed (shown as a negative adjustment if already paid out).
- Volume discount spreads across photos from several photographers → the discount is split across line items in proportion to their prices, so each photographer's earnings are based on what was actually paid for their photo.
- A photo has no photographer assigned → it cannot be published for sale until one is assigned.
- A photographer is deactivated → their photos remain on sale (unless removed) and their past earnings and balance remain visible.
- Preview generation fails for an uploaded photo → the photo stays unpublished and is flagged in the admin area with a retry option; it never appears in the store without a preview.
- Admin replaces a photo's full-quality file → the preview is regenerated from the new file and the link stays intact; past buyers' downloads deliver the version current at download time.
- Very large originals (e.g., 25+ MB each) → upload and download still succeed; previews remain small and fast.

## Requirements *(mandatory)*

### Functional Requirements

**Storage & Management (Admin)**

- **FR-001**: Admins MUST be able to bulk-upload full-resolution photos into a sale collection associated with an existing event, at least 500 photos per upload session.
- **FR-002**: Admins MUST upload only the full-quality photo. The system MUST store it in private storage that is never publicly accessible except through a purchase-granted, time-limited download link.
- **FR-003**: For each uploaded photo the system MUST automatically generate a public preview that is reduced in resolution and visibly watermarked with the Beats on the Block brand. Admins do not create or upload watermarked files.
- **FR-003a**: Each preview MUST be permanently linked one-to-one to the full-quality original it was generated from, as a single Sale Photo. Buying a preview MUST deliver exactly its linked original. Removing a Sale Photo removes both versions together.
- **FR-004**: Admins MUST be able to set a default price per collection and override the price for individual photos.
- **FR-005**: Admins MUST be able to publish/unpublish a collection and remove individual photos from sale; changes take effect on the public store within 1 minute.
- **FR-006**: Admins MUST be able to choose a cover photo and reorder or hide photos within a collection.
- **FR-007**: Store management MUST be restricted to authenticated admins using the existing admin sign-in.

**Browsing (Visitor)**

- **FR-008**: The site MUST provide a public photo store page reachable from the main site navigation.
- **FR-009**: The store MUST list published collections by event with cover image, event name, date, and photo count, newest event first.
- **FR-010**: Visitors MUST be able to browse a collection in a grid of previews that loads progressively and open a detail view with previous/next navigation, price, and add-to-cart.
- **FR-011**: Visitors MUST NOT be able to obtain an unwatermarked or full-resolution image without purchasing it.

**Cart, Checkout & Delivery**

- **FR-012**: Visitors MUST be able to add and remove photos in a cart that persists for at least the browser session without creating an account.
- **FR-013**: Checkout MUST collect the buyer's email address and payment, and MUST show the itemized total before payment is submitted.
- **FR-014**: Payment card details MUST be handled by a PCI-compliant payment provider and MUST never be stored by the site.
- **FR-015**: On successful payment the system MUST record the order and grant download access to the purchased originals only.
- **FR-016**: The system MUST display download links on the order confirmation page and send them in a confirmation email to the buyer.
- **FR-017**: Download links MUST expire after 7 days; buyers MUST be able to request fresh links be sent to their order email.
- **FR-018**: Orders MUST be fulfilled even if the buyer leaves the site before the confirmation page loads.
- **FR-019**: The store MUST sell digital downloads only; no physical products, shipping addresses, or shipping charges are involved.

**Orders (Admin)**

- **FR-020**: Admins MUST be able to view all orders with buyer email, items, total, status, and date, filter by date range and event, and export to CSV.
- **FR-021**: Admins MUST be able to re-send download links for any order and mark an order refunded, which revokes its download access.
- **FR-022**: The organizer MUST receive an email notification for each completed order.

**Rights & Privacy**

- **FR-023**: The store MUST display the license terms for purchased photos (personal use) before checkout and in the confirmation email.
- **FR-024**: The store MUST provide a visible way for attendees to request removal of a photo, routed to the organizer.
- **FR-025**: Every sale photo MUST be attributed to exactly one photographer, and the photographer's name MUST be shown as a credit on the collection and in the photo detail view.

**Photographers & Revenue Share**

- **FR-026**: Admins MUST be able to create, edit, and deactivate photographers with name, contact email, and commission percentage (0–100%).
- **FR-027**: Each order line MUST record the photographer and the commission percentage in effect at the time of sale, plus the actual amount paid for that photo after discounts.
- **FR-028**: Admins MUST be able to view, for any date range, each photographer's photos sold, gross attributed sales, earnings, payouts recorded, and outstanding balance, and export it to CSV.
- **FR-029**: Admins MUST be able to record payouts made outside the system (amount, date, note); the system MUST NOT send money to photographers automatically.
- **FR-030**: Refunds MUST reverse the related photographer earnings.

**Pricing Model**

- **FR-031**: Each photo MUST be purchasable individually at its price (collection default or override).
- **FR-032**: The store MUST apply volume discounts automatically based on the number of photos in the cart, using admin-configurable tiers (default: 3–4 photos 15% off, 5–9 photos 25% off, 10+ photos 35% off).
- **FR-033**: Only the single highest qualifying tier applies; tiers count photos across all events in the cart.
- **FR-034**: Discounts MUST be shown as a separate line in the cart, at checkout, and in the confirmation email, and the cart MUST show how many more photos unlock the next tier.

### Key Entities

- **Photo Collection**: A set of for-sale photos tied to one event; has status (draft/published), default price, cover photo, photographer credit, and display order.
- **Sale Photo**: One photo in a collection, credited to one photographer; has a private full-quality original and a public watermarked preview plus thumbnail that are generated from that original and permanently linked to it (one Sale Photo = one original + its previews), optional price override, visibility (for sale/removed), and sort order.
- **Cart**: A visitor's temporary selection of sale photos with a running total; not tied to an account.
- **Order**: A completed (or failed/refunded) purchase; has buyer email, line items (photo + price paid), total, payment reference, status, and timestamps.
- **Download Grant**: Time-limited access to the originals in one order; has expiry and can be reissued or revoked.
- **Photographer**: An outside photographer; has name, contact email, current commission percentage, and active/inactive status. Owns many sale photos.
- **Order Line**: One photo in an order; records list price, discount share, amount paid, photographer, and commission percentage at time of sale.
- **Payout**: A record of money paid to a photographer outside the system; has amount, date, and note.
- **Discount Tier**: A minimum photo count and percentage off; admin-configurable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can upload, price, and publish a 300-photo event collection in under 30 minutes of hands-on time.
- **SC-002**: Visitors see the first screen of previews in a collection within 2 seconds on a typical mobile connection.
- **SC-003**: A visitor can go from opening a photo to completed purchase in under 3 minutes.
- **SC-004**: 100% of successful payments result in the buyer receiving download access (on-page and by email); zero originals are reachable without a purchase.
- **SC-005**: 95% of buyers download their photos without contacting the organizer for help.
- **SC-006**: Photo takedown requests are actioned (photo removed from sale) within 1 minute of the admin acting on them.
- **SC-007**: Photographer earnings reports match order records to the cent for every photographer in every reporting period.
- **SC-008**: An admin can produce a period's payout figures for all photographers in under 5 minutes.
- **SC-009**: At least 30% of orders contain 3 or more photos (volume discounts encourage larger orders).
- **SC-010**: The store generates its first paid order within 2 weeks of launching the first collection.

## Assumptions

- Photos for sale are event photos (attendees, DJs, crowd) from Beats on the Block / Connect Atlanta events, organized by event.
- The store is a new section separate from the existing free public gallery; the gallery continues to show its curated photos unchanged.
- Buyers check out as guests by email; no customer accounts are created.
- Prices are in USD; sales tax handling follows the payment provider's standard tools for digital goods.
- The existing admin area and its sign-in are reused for store management and orders.
- Default license is personal use; commercial licensing requests are handled manually via the contact form.
- Commission percentages are calculated on the amount actually paid for the photo (after discounts), before payment-processing fees.
- Payouts to photographers are made manually (e.g., bank transfer or payment app) and only recorded in the system.
- Photographers do not log in to the site; the organizer shares earnings reports with them.
- Photographers have agreed to have their photos sold on these terms; contracts are handled outside the system.
- Original photos are delivered as high-quality JPEGs at the resolution uploaded.
- Refunds are processed manually by the organizer through the payment provider; the system only records the refund and revokes access.

## Out of Scope

- Face recognition or "find photos of me" search (possible future enhancement).
- Customer accounts, wishlists, or order history login.
- Physical prints, framing, or any shipped products.
- Automatic payouts to photographers or a photographer self-service portal.
- Tax forms (e.g., 1099s) for photographers; the earnings export supports preparing them manually.
- Discount codes and promotions (volume discounts are the only discounting).
- Selling non-photo goods (merch remains on the external Bonfire store).
