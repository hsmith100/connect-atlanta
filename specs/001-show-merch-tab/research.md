# Research: Restore Merch Tab with Bonfire Store

## Decision 1: Next.js Image domain allowlisting for Bonfire

**Decision**: Add Bonfire's image CDN hostname to `remotePatterns` in `next.config.js`.

**Rationale**: `next.config.js` already has `unoptimized: true` for the static export, and already lists `img.youtube.com` in `remotePatterns` as a precedent. Even with `unoptimized: true`, adding the Bonfire hostname keeps the allowlist explicit and consistent with the existing pattern. The exact hostname must be verified by inspecting a real Bonfire product image URL (right-click → copy image address on the Bonfire store page). Common Bonfire CDN hostnames include `cdn.bonfire.com` or `storage.googleapis.com` — verify before adding.

**Alternatives considered**:
- Use plain `<img>` tags instead of `<Image>` to bypass `remotePatterns` entirely — rejected because the existing `MerchGrid.tsx` uses `<Image>` and the pattern should stay consistent.
- Download Bonfire product images and serve locally — rejected per clarification session (images should come directly from Bonfire CDN).

---

## Decision 2: Product data sourcing

**Decision**: Product name, price, image URL, and individual Bonfire product URL are hardcoded in `MerchGrid.tsx` as a static array — the same pattern as the previous Fourthwall implementation.

**Rationale**: The store is small, static, and not expected to change frequently. No Bonfire API integration is needed. Hardcoding keeps the page purely static with zero network dependencies at runtime (images load from Bonfire CDN, not via an API call).

**Alternatives considered**:
- Fetch product data from Bonfire's API at runtime — rejected; no Bonfire API credentials exist and adds runtime dependency to a static page.
- Admin-managed product list in DynamoDB — rejected (Principle II: YAGNI — no present requirement for dynamic merch management).

**Action required**: Before implementing `MerchGrid.tsx`, collect from the Bonfire store (`https://www.bonfire.com/store/beats-on-the-block/`):
1. Each product's name
2. Each product's price
3. Each product's image URL (from Bonfire CDN — inspect element or right-click image)
4. Each product's individual product page URL

---

## Decision 3: Merch nav link placement

**Decision**: "Merch" inserted between "Join Us" and "Contact" in both desktop and mobile nav in `Header.tsx`.

**Rationale**: Matches the spec assumption and preserves the logical site flow (Home → About → Events → Gallery → Join Us → Merch → Contact).

**Alternatives considered**: None — placement was specified in the spec.

---

## Decision 4: Test updates

**Decision**: Update both `Header.test.tsx` and `MerchGrid.test.tsx`; delete the existing MerchGrid snapshot.

**Rationale**: Constitution X mandates tests for all components with logic. `Header.test.tsx` currently asserts all 6 nav links — adding Merch requires adding one assertion to the "renders all navigation links" test. `MerchGrid.test.tsx` currently asserts specific Fourthwall product names and URLs — both assertions need replacing with Bonfire equivalents. The snapshot is hardcoded to old product data and must be deleted so it regenerates.

**Snapshot file to delete**: `frontend/components/merch/__snapshots__/MerchGrid.test.tsx.snap` (if it exists).
