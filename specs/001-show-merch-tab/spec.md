# Feature Specification: Restore Merch Tab with Bonfire Store

**Feature Branch**: `001-show-merch-tab`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: User description: "We earlier decided to remove the merch tab from navigation visibility because the old merch page was showing last years merch. We have updated the merch on the merch store and need to show the tab again along with the new merch store: https://www.bonfire.com/store/beats-on-the-block/"

## Clarifications

### Session 2026-04-22

- Q: How should the `/merch` page display merchandise? → A: Product card grid — individual cards with images, names, prices, each linking to that product's Bonfire page (same layout as before, updated for Bonfire).
- Q: Where will the product images for the new Bonfire items come from? → A: Link directly to Bonfire-hosted product image URLs (no local image files).
- Q: Should the `/merch` page include a store-level "Shop All on Bonfire" link in addition to individual product cards? → A: Yes — include a "Shop All" / "Visit the Store" link to the Bonfire store homepage below the product grid.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find Merch from Navigation (Priority: P1)

A visitor on any page of the Connect Atlanta site wants to browse and buy official Beats on the Block merchandise. They look for a "Merch" link in the site navigation, click it, and are taken to a page that directs them to the current store.

**Why this priority**: The navigation tab is the primary entry point. Without it, the merch page is unreachable for most visitors. Restoring it immediately enables merch discovery and sales.

**Independent Test**: Add the Merch nav link; verify it appears on desktop and mobile and routes to `/merch`.

**Acceptance Scenarios**:

1. **Given** a visitor is on any page, **When** they look at the desktop navigation bar, **Then** they see a "Merch" link among the nav items.
2. **Given** a visitor is on mobile, **When** they open the hamburger menu, **Then** they see "Merch" listed among the navigation links.
3. **Given** a visitor clicks the "Merch" nav link, **Then** they are taken to `/merch`.

---

### User Story 2 - Browse and Buy Current Merch (Priority: P1)

A visitor lands on the `/merch` page and sees a product card grid showing current Beats on the Block merchandise — with images, names, and prices. They click a card and are taken directly to that product's page on Bonfire to complete the purchase.

**Why this priority**: Displaying stale Fourthwall links was the original reason the tab was hidden. The product grid gives visitors a reason to engage before leaving the site and drives higher conversion than a generic CTA alone.

**Independent Test**: Load `/merch`, verify the product grid renders with images and prices, click each card, and confirm it opens the correct Bonfire product page in a new tab with no Fourthwall links present.

**Acceptance Scenarios**:

1. **Given** a visitor is on the `/merch` page, **When** the page loads, **Then** they see a grid of product cards, each showing a product image, name, and price.
2. **Given** a visitor clicks a product card, **Then** they are taken to that product's individual page on the Bonfire store (`https://www.bonfire.com/store/beats-on-the-block/`) in a new tab.
3. **Given** the `/merch` page loads, **Then** no links to `connectmerch-shop.fourthwall.com` are present anywhere on the page.

---

### Edge Cases

- What if the Bonfire store URL changes or goes offline? The merch page should degrade gracefully — a broken external link is acceptable, but the page itself must not error.
- Does the mobile menu layout remain intact after the additional "Merch" nav item is added?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site navigation MUST display a "Merch" link on both desktop and mobile menus.
- **FR-002**: The "Merch" nav link MUST route visitors to the `/merch` page (not a direct external redirect from the nav itself).
- **FR-003**: The `/merch` page MUST display a product card grid showing each current merchandise item with an image (sourced directly from Bonfire), name, and price.
- **FR-004**: Each product card MUST link to that product's individual page on the Bonfire store and open it in a new tab.
- **FR-005**: The `/merch` page MUST NOT contain any links to the old Fourthwall store (`connectmerch-shop.fourthwall.com`).
- **FR-006**: The `/merch` page MUST include a "Shop All" or "Visit the Store" link to `https://www.bonfire.com/store/beats-on-the-block/` displayed below the product grid, opening in a new tab.

### Assumptions

- The `/merch` page will use the same product card grid layout as before, updated with current Bonfire product URLs, Bonfire-hosted images, and prices.
- Product images will be loaded from Bonfire's CDN URLs — the Bonfire domain will need to be allowlisted for external image loading.
- The "Merch" nav link will be positioned between "Join Us" and "Contact" to match the existing nav ordering pattern.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The "Merch" tab is visible and functional in the navigation on 100% of site pages, on both desktop and mobile viewports.
- **SC-002**: Zero Fourthwall product links remain accessible from the `/merch` page after the update.
- **SC-003**: Visitors can reach the Bonfire store in 2 clicks or fewer from any page on the site (nav → Merch page → any product card or "Shop All" link).
- **SC-004**: The `/merch` page loads without errors and the Bonfire store link is clearly visible without scrolling on a standard desktop viewport.
