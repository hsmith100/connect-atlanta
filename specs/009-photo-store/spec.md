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
- Q: Should photographers be paid automatically for their share of each sale? → A: Yes. Each photographer's share is sent to them automatically after every sale; the organizer does not pay photographers by hand.
- Q: Where does the photo store live on the site? → A: The existing Merch page becomes a single "Shop" page with two sections, Merch and Event Photos. The nav link "Merch" is renamed "Shop" (no new nav link), and the Gallery links visitors to the Event Photos section.

### Session 2026-10-06

- Q: Should gallery photos and store photos be managed separately? → A: No. There is one photo library, organized by event, managed in one admin place. Each photo has two independent switches: "Show in gallery" and "For sale". The separate gallery photo system is retired.
- Q: What does the public Gallery show for each photo? → A: A clean (unwatermarked) web-size version, about 2000px on the long edge. The full-quality original stays private and is only delivered to buyers.
- Q: What happens to the photos already in the gallery? → A: They are moved into the library by a one-time migration: each original is moved to private storage, the web and watermarked versions are generated, and the public full-resolution file is removed. They stay in the gallery and can be marked for sale.
- Q: Can a library photo exist without an event? → A: No. Every photo belongs to an event. Existing gallery photos without an event are assigned one during migration.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Manages One Photo Library and Prices Photos for Sale (Priority: P1)

An organizer has a large batch of event photos (hundreds per event). They sign in to the existing admin area, open the **Photos** tab, choose the event's collection, and bulk-upload the full-quality photos. Admins upload only the full-quality photos. For each one, the system automatically creates a clean web-size version for the gallery and a watermarked, lower-quality preview for the store, and links both to the full-quality original, so a purchase of the preview delivers the matching original. Only the full-quality original is kept private. Each photo has two switches, **Show in gallery** and **For sale**, so the same photo can appear in the free gallery, be sold, both, or neither. The organizer sets a default price for the event's photos, can override the price on individual photos, and publishes the collection's store listing when ready.

**Why this priority**: Nothing can be shown or sold until photos are stored safely and priced. Managing gallery and store photos in one place avoids uploading the same photos twice and keeping two copies in sync.

**Independent Test**: Upload a batch of photos for one event through the Photos tab, assign a photographer, confirm the web and watermarked versions are generated, confirm the originals cannot be reached by any public link, toggle gallery and for-sale on a few photos, and confirm prices are saved.

**Acceptance Scenarios**:

1. **Given** an authenticated admin, **When** they upload 200 full-quality photos to an event's collection, **Then** all 200 are stored, each gets an automatically generated clean web version and watermarked preview linked to it, and upload progress and any per-file failures are shown.
2. **Given** a stored photo, **When** anyone requests it via a public page or guessed URL, **Then** only the web-size and watermarked versions are reachable; the full-quality original is not.
3. **Given** an event collection, **When** the admin sets a default price and overrides one photo's price, **Then** the overridden photo shows its own price and all others show the default.
4. **Given** an upload batch, **When** the admin assigns the photographer who took it, **Then** every photo in the batch is attributed to that photographer and their name appears as the credit.
5. **Given** a collection whose store listing is not published (draft), **When** a visitor browses the store, **Then** that collection is not visible in the store (its gallery photos are unaffected).
6. **Given** a photo, **When** the admin turns on "Show in gallery" and turns off "For sale", **Then** it appears in the public gallery as a clean web-size image and does not appear in the store; and the reverse combination shows it only in the store.
7. **Given** photos shown in the gallery, **When** the admin reorders them in the gallery order view, **Then** the public gallery shows them in that order.

---

### User Story 2 - Visitor Browses and Finds Their Photos (Priority: P1)

A visitor who attended an event opens the site's Gallery or Shop page, goes to the Event Photos section, picks the event they attended, and scrolls through a fast-loading grid of watermarked previews. They can open any photo in a larger view to see detail and the price.

**Why this priority**: Shoppers must be able to find photos of themselves quickly; with hundreds of photos per event, browsing by event is the minimum for a usable store.

**Independent Test**: With one published collection, open the store, select the event, browse the grid, and open a photo's detail view showing a watermarked image and its price.

**Acceptance Scenarios**:

1. **Given** published collections exist, **When** a visitor opens the Shop page, **Then** the Event Photos section lists the events that have photos for sale, each with a cover image, event name, date, and photo count.
2. **Given** a visitor is on the Gallery page, **When** they click "Shop event photos", **Then** they land on the Shop page's Event Photos section; **Given** they open a gallery photo whose event has photos for sale, **Then** the full-size view offers "Buy photos from this event", which opens that event's photos.
3. **Given** a visitor selects an event, **When** the collection loads, **Then** previews display in a grid that loads progressively as they scroll.
4. **Given** a visitor clicks a preview, **When** the detail view opens, **Then** they see a larger watermarked image, the price, and an "Add to cart" action, and can move to the previous/next photo.
5. **Given** a visitor on a phone, **When** they browse, **Then** the grid and detail view are fully usable at mobile widths.

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
6. **Given** a buyer lost their email, **When** they click "Lost your download link?" in the Shop page's Event Photos section and enter their order email, **Then** a new email with valid download links is sent to that address only.

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

### User Story 5 - Photographers Are Paid Automatically (Priority: P2)

The organizer adds each outside photographer with a commission percentage and sends them a setup link. The photographer follows the link once to connect their bank account with the payment provider. From then on, whenever one of their photos sells, their share is sent to them automatically, and the provider deposits it to their bank on a regular schedule. The organizer can see each photographer's earnings and what has been sent to them; photographers can see their own payments in the provider's dashboard.

**Why this priority**: Photographers must be paid accurately and on time to keep contributing, and paying by hand doesn't scale. Sales can technically happen before this is fully set up, but no photographer's photos can go on sale until they can be paid.

**Independent Test**: Add two photographers with different commission rates, complete setup for both in test mode, sell photos from each in one order, and confirm each received exactly their share and the earnings view matches.

**Acceptance Scenarios**:

1. **Given** an admin adds a photographer with name, email, and commission percentage, **When** they send the setup link, **Then** the photographer receives an email to connect their bank account, and the admin sees their status as "Setup pending".
2. **Given** a photographer completes setup, **When** the admin views photographers, **Then** that photographer shows "Ready to be paid".
3. **Given** a photographer has not completed setup, **When** the admin tries to publish a collection containing their photos, **Then** publishing is blocked with a message naming the photographer.
4. **Given** one order contains photos by two photographers, **When** payment succeeds, **Then** each photographer is automatically sent (amount actually paid for each of their photos after discounts) × (their commission percentage at time of sale), and the admin can see each payment.
5. **Given** completed orders, **When** the admin opens Photographer Earnings for a date range, **Then** each photographer's photos sold, gross sales, earnings, and amount sent are shown and can be exported to CSV with per-sale detail.
6. **Given** a photographer's commission percentage is changed, **When** later sales occur, **Then** earlier sales keep the percentage that applied when they were sold.

---

### User Story 6 - Admin Removes a Photo on Request (Priority: P2)

An attendee asks that a photo of them be taken down. The organizer finds the photo in the admin area and removes it from sale; it immediately disappears from the public store.

**Why this priority**: Selling images of people requires a fast takedown path to protect attendees and the brand.

**Independent Test**: Remove a published photo and confirm it no longer appears in the store or can be added to a cart.

**Acceptance Scenarios**:

1. **Given** a photo for sale, **When** the admin removes it from sale, **Then** it is no longer visible in the store and cannot be purchased.
2. **Given** a removed photo already in a visitor's cart, **When** they check out, **Then** it is dropped from the order with a notice and they are not charged for it.

---

### User Story 7 - Gallery Runs on the Photo Library (Priority: P1)

The public Gallery page shows photos from the photo library that are switched into the gallery, as clean web-size images in the admin's chosen order. The 43 photos currently in the gallery are moved into the library once: each is assigned to an event, its original goes to private storage, its web and watermarked versions are created, and its public full-resolution file is removed. Afterwards there is only one place to manage photos.

**Why this priority**: Without it the site keeps two photo systems, and today's gallery serves full-resolution originals (up to 30 MB) that anyone can download for free, which undermines selling those photos and slows the gallery.

**Independent Test**: Run the migration in dev, then confirm the Gallery shows the same photos in the same order using web-size images, each photo appears in its event's collection in the Photos tab, the old full-resolution URLs no longer load, and the old gallery admin screen is gone.

**Acceptance Scenarios**:

1. **Given** library photos with "Show in gallery" on, **When** a visitor opens the Gallery, **Then** they see those photos' clean web-size versions in gallery order, and none of the photos with it off.
2. **Given** the existing gallery photos, **When** the migration runs, **Then** every photo is in the library under an event, keeps its gallery visibility and order, has its original in private storage, and its old public full-resolution URL no longer returns the image.
3. **Given** an existing gallery photo without an event, **When** the migration runs, **Then** it does not proceed until that photo has been assigned an event.
4. **Given** the migration ran, **When** it is run again, **Then** no photo is duplicated (the migration is safe to re-run).
5. **Given** the migration is complete, **When** an admin opens the admin area, **Then** the old separate gallery photo management screen is no longer present.

---

### Edge Cases

- A visitor buys the same photo twice → allowed; each order is independent (or the system warns them it is already purchased with that email — warning only, not a block).
- Download link expires before the buyer uses it → buyer can request a re-send from the confirmation email/page or via the admin.
- Payment succeeds but the confirmation email fails to send → order is still recorded as paid and downloads remain available from the confirmation page; admin can re-send.
- Payment is charged but the visitor closes the browser before the confirmation page → order is still fulfilled and the email is still sent.
- Admin uploads a non-image or corrupt file → that file is rejected with a reason; the rest of the batch continues.
- Admin uploads a duplicate file to the same collection → flagged as a duplicate and skipped unless the admin confirms.
- A collection is unpublished while a visitor is browsing → photos already in the cart can no longer be purchased and are removed at checkout with a notice.
- Refund issued for an order → download access is revoked and each photographer's share is taken back from them automatically. If a photographer's balance with the provider can't cover it (already deposited to their bank), the amount is recorded as owed and deducted from their next payments.
- Volume discount spreads across photos from several photographers → the discount is split across line items in proportion to their prices, so each photographer's earnings are based on what was actually paid for their photo.
- A photo has no photographer assigned → it cannot be published for sale until one is assigned.
- A photographer is deactivated → their photos remain on sale (unless removed) and they keep receiving their share; past earnings remain visible.
- A photographer's payment account becomes restricted after their photos are on sale (e.g., the provider needs more information) → the sale still completes, their share is recorded as "not sent", the admin is shown the problem, and the admin can retry sending once the photographer fixes their account.
- A photographer's setup link expires or is lost → the admin can send a new one at any time.
- Preview generation fails for an uploaded photo → the photo stays unpublished and is flagged in the admin area with a retry option; it never appears in the store without a preview.
- A photo is shown in the gallery and then removed on request → it disappears from both the gallery and the store.
- A photo is switched out of the gallery → it disappears from the gallery but remains for sale if "For sale" is on.
- A photo is switched to "For sale" without a photographer (e.g. a migrated gallery photo) → the collection can't be published until a photographer is assigned.
- Admin replaces a photo's full-quality file → the preview is regenerated from the new file and the link stays intact; past buyers' downloads deliver the version current at download time.
- Very large originals (e.g., 25+ MB each) → upload and download still succeed; previews remain small and fast.

## Requirements *(mandatory)*

### Functional Requirements

**Storage & Management (Admin)**

- **FR-000**: There MUST be a single photo library managed from one admin place (the Photos tab). Every photo belongs to exactly one event's collection. The gallery and the store both read from this library; there is no separate gallery photo system.
- **FR-001**: Admins MUST be able to bulk-upload full-resolution photos into an event's collection, at least 500 photos per upload session.
- **FR-002**: Admins MUST upload only the full-quality photo. The system MUST store it in private storage that is never publicly accessible except through a purchase-granted, time-limited download link.
- **FR-003**: For each uploaded photo the system MUST automatically generate (a) a public preview that is reduced in resolution and visibly watermarked with the Beats on the Block brand, for the store, and (b) a clean, unwatermarked web-size version (about 2000px on the long edge), for the gallery. Admins do not create or upload these versions.
- **FR-003a**: All versions of a photo MUST be permanently linked to the full-quality original they were generated from, as a single Library Photo. Buying a preview MUST deliver exactly its linked original. Removing a Library Photo removes all of its versions together.
- **FR-003b**: Each photo MUST have two independent switches, "Show in gallery" and "For sale". Only photos with "For sale" on, in a collection whose store listing is published, appear in the store. Only photos with "Show in gallery" on appear in the gallery.
- **FR-003c**: Admins MUST be able to set the order of gallery photos across all events.
- **FR-004**: Admins MUST be able to set a default price per collection and override the price for individual photos.
- **FR-005**: Admins MUST be able to publish/unpublish a collection and remove individual photos from sale; changes take effect on the public store within 1 minute.
- **FR-006**: Admins MUST be able to choose a cover photo and reorder photos within a collection, and switch photos in or out of the gallery and the store individually or in bulk.
- **FR-007**: Photo library and store management MUST be restricted to authenticated admins using the existing admin sign-in.
- **FR-007a**: The existing gallery photos MUST be migrated into the library by a one-time process that moves each original to private storage, generates its web and watermarked versions, assigns it to an event, keeps its gallery visibility and order, and then removes its public full-resolution file. After migration, the old gallery photo storage and admin screen are retired.

**Browsing (Visitor)**

- **FR-008**: The existing Merch page MUST become a single Shop page with two sections, **Merch** (existing products, still purchased on the external merch store) and **Event Photos** (the photo store), and the nav link "Merch" MUST be renamed "Shop" on desktop and mobile. No additional nav link is added.
- **FR-008a**: Existing links to the Merch page MUST continue to work by sending visitors to the Shop page.
- **FR-008b**: The Gallery page MUST link to the Shop page's Event Photos section, and a gallery photo's full-size view MUST link directly to its event's photos when that event has photos for sale.
- **FR-008c**: Each Shop section MUST make clear where checkout happens (merch on the external merch store, photos on this site).
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
- **FR-021**: Admins MUST be able to re-send download links for any order and fully refund an order from the admin area; a refund returns the buyer's payment, takes back photographer shares (FR-030), and revokes download access.
- **FR-022**: The organizer MUST receive an email notification for each completed order.

**Rights & Privacy**

- **FR-023**: The store MUST display the license terms for purchased photos (personal use) before checkout and in the confirmation email.
- **FR-024**: The store MUST provide a visible way for attendees to request removal of a photo, routed to the organizer.
- **FR-025**: Every sale photo MUST be attributed to exactly one photographer, and the photographer's name MUST be shown as a credit on the collection and in the photo detail view.

**Photographers & Revenue Share**

- **FR-026**: Admins MUST be able to create, edit, and deactivate photographers with name, contact email, and commission percentage (0–100%).
- **FR-027**: Each order line MUST record the photographer and the commission percentage in effect at the time of sale, plus the actual amount paid for that photo after discounts.
- **FR-028**: Admins MUST be able to view, for any date range, each photographer's photos sold, gross attributed sales, earnings, amount sent, and any amount owed back, and export it to CSV.
- **FR-029**: The system MUST automatically send each photographer their share of every paid order through the payment provider, without any manual payment by the organizer. Photographers MUST connect their own bank account through the provider's secure setup flow, started from an emailed link; the site never collects photographers' bank details.
- **FR-029a**: A photographer's photos MUST NOT be publishable until the photographer has completed setup and can receive payments.
- **FR-029b**: Shares that fail to send MUST be recorded as "not sent", shown to the admin, and retryable by the admin.
- **FR-030**: Refunds MUST automatically take back the related photographer shares; any amount that can't be taken back MUST be recorded as owed and deducted from that photographer's future shares.

**Pricing Model**

- **FR-031**: Each photo MUST be purchasable individually at its price (collection default or override).
- **FR-032**: The store MUST apply volume discounts automatically based on the number of photos in the cart, using admin-configurable tiers (default: 3–4 photos 15% off, 5–9 photos 25% off, 10+ photos 35% off).
- **FR-033**: Only the single highest qualifying tier applies; tiers count photos across all events in the cart.
- **FR-034**: Discounts MUST be shown as a separate line in the cart, at checkout, and in the confirmation email, and the cart MUST show how many more photos unlock the next tier.

### Key Entities

- **Photo Collection**: All library photos for one event, used by both the gallery and the store; has status (draft/published), default price, cover photo, photographer credit, and display order.
- **Library Photo** (formerly "Sale Photo"): One photo in an event's collection, credited to one photographer (required before it can be sold). It has a private full-quality original plus public versions generated from it and permanently linked to it: a clean web-size version and thumbnail for the gallery, and a watermarked preview and thumbnail for the store. It also has "Show in gallery" and "For sale" switches, a gallery order, an optional price override, a removed flag (takedown), and an order within its collection.
- **Cart**: A visitor's temporary selection of sale photos with a running total; not tied to an account.
- **Order**: A completed (or failed/refunded) purchase; has buyer email, line items (photo + price paid), total, payment reference, status, and timestamps.
- **Download Grant**: Time-limited access to the originals in one order; has expiry and can be reissued or revoked.
- **Photographer**: An outside photographer; has name, contact email, current commission percentage, active/inactive status, payment setup status, and any amount owed back. Owns many sale photos.
- **Order Line**: One photo in an order; records list price, discount share, amount paid, photographer, and commission percentage at time of sale.
- **Photographer Payment**: An automatic transfer of a photographer's share for one order; has amount, status (sent / not sent / taken back), and the provider's reference.
- **Discount Tier**: A minimum photo count and percentage off; admin-configurable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can upload, price, and publish a 300-photo event collection in under 30 minutes of hands-on time.
- **SC-002**: Visitors see the first screen of previews in a collection within 2 seconds on a typical mobile connection.
- **SC-003**: A visitor can go from opening a photo to completed purchase in under 3 minutes.
- **SC-004**: 100% of successful payments result in the buyer receiving download access (on-page and by email); zero originals are reachable without a purchase.
- **SC-005**: 95% of buyers download their photos without contacting the organizer for help.
- **SC-006**: Photo takedown requests are actioned (photo removed from sale) within 1 minute of the admin acting on them.
- **SC-006a**: After migration, zero full-resolution photos are publicly reachable, and the Gallery's full-size view loads in under 2 seconds on a typical mobile connection.
- **SC-007**: Photographer earnings reports match order records to the cent for every photographer in every reporting period.
- **SC-008**: 100% of photographer shares are sent automatically within 1 minute of payment, with zero manual payments by the organizer (excluding shares held because a photographer's account is restricted).
- **SC-009**: At least 30% of orders contain 3 or more photos (volume discounts encourage larger orders).
- **SC-010**: The store generates its first paid order within 2 weeks of launching the first collection.

## Assumptions

- Photos for sale are event photos (attendees, DJs, crowd) from Beats on the Block / Connect Atlanta events, organized by event.
- The free public Gallery and the store share one photo library. The Gallery shows clean web-size versions of photos switched into the gallery; the store shows watermarked previews of photos switched on for sale.
- Hero cards and event flyers are not photos in the library; they keep their current admin screens.
- Buyers check out as guests by email; no customer accounts are created.
- Prices are in USD; sales tax handling follows the payment provider's standard tools for digital goods.
- The existing admin area and its sign-in are reused for store management and orders.
- Default license is personal use; commercial licensing requests are handled manually via the contact form.
- Commission percentages are calculated on the amount actually paid for the photo (after discounts), before payment-processing fees.
- The organization (not the photographers) is the seller of record and pays card-processing fees and the provider's per-photographer payment fees; photographers receive their full commission.
- Photographers do not log in to the site; they see their own payments in the payment provider's dashboard.
- All photographers are U.S.-based with U.S. bank accounts.
- Photographers have agreed to have their photos sold on these terms; contracts are handled outside the system.
- Original photos are delivered as high-quality JPEGs at the resolution uploaded.
- Refunds are issued by the organizer from the site's admin Orders view, which refunds the buyer, takes back photographer shares, and revokes download access in one action.

## Out of Scope

- Face recognition or "find photos of me" search (possible future enhancement).
- Customer accounts, wishlists, or order history login.
- Physical prints, framing, or any shipped products.
- A photographer portal on our site (photographers use the payment provider's dashboard instead).
- Year-end tax forms (e.g., 1099s) for photographers are handled through the payment provider's tax-reporting option, configured outside this feature.
- Discount codes and promotions (volume discounts are the only discounting).
- Selling non-photo goods on this site (merch keeps checking out on the external Bonfire store; the Shop page only links to it).
