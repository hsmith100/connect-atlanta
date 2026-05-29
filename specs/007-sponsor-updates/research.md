# Research: Sponsor Updates & AHS Presented-By Hero Placement

**Branch**: `007-sponsor-updates` | **Date**: 2026-05-29

## Decision 1: AHS Logo Placement on Mobile

**Question**: The BOTB logo (`BOTB_White.png`) is rendered only on desktop (`hidden md:block`). Where should the AHS "Presented By" logo appear on mobile?

**Decision**: Add the AHS logo in a new `div` that is *outside* the `hidden md:block` wrapper, placed between the BOTB block and `renderContent()`. This makes it visible on all screen sizes.

**Rationale**:
- On desktop: BOTB logo → AHS logo → event/card content. Both logos are visible, with AHS immediately following the event name.
- On mobile: AHS logo → event/card content. The BOTB logo remains mobile-hidden per existing design; AHS becomes the leading visual element.
- This satisfies FR-001 ("above all other hero content") and the mobile acceptance scenario without duplicating markup or using JS-based visibility toggles.

**Alternatives considered**:
- Add AHS logo *inside* the `hidden md:block` block → mobile visitors never see it. Rejected (violates spec).
- Duplicate the AHS logo (one desktop, one mobile) → unnecessary complexity. Rejected (Principle II).

---

## Decision 2: Sponsor Logo Sizing Strategy

**Question**: The old `SponsorsSection` used name-based height overrides (`SMALLER_HEIGHT`, `LARGER_HEIGHT` sets). The 2026 logos are numbered PNGs with unknown relative dimensions. What sizing strategy should be used?

**Decision**: Use uniform Tailwind sizing for all 2026 logos: `max-h-[50px] max-w-[60px]` (same as the current "default" tier). Remove `SMALLER_HEIGHT` and `LARGER_HEIGHT` sets.

**Rationale**:
- The source PNG files are all high-resolution (2000×1545 confirmed for 2.png). All will be constrained well by the same size caps.
- Removing conditional logic simplifies the component and eliminates a source of future confusion when sponsor names change.
- If visual inspection after implementation reveals specific logos need adjustment, sizing can be tuned at that time — without needing a data-driven approach upfront.

**Alternatives considered**:
- Keep name-based conditional sizing, adding 2026 sponsor names to the sets → requires knowing all sponsor names upfront; premature. Rejected (Principle II).
- Per-logo explicit sizing in the data array → more flexible but over-engineered for a grid of uniform-looking sponsor logos. Rejected (Principle II).

---

## Decision 3: Sponsor Alt Text

**Question**: The 2026 logos are named `3.png` through `15.png` — no human-readable names embedded in filenames. What alt text should be used?

**Decision**: Use `Sponsor [N]` as a placeholder (e.g., `Sponsor 3`, `Sponsor 4`, …, `Sponsor 15`). The spec notes this and asks the user to supply real sponsor names.

**Rationale**:
- Screen reader users get non-empty, non-duplicate alt text on every logo immediately.
- Real names can be dropped in with a simple data array update (one-line change per sponsor) once the user provides them — no structural change required.

**Alternatives considered**:
- Empty alt text → accessibility violation; rejected.
- `aria-hidden="true"` on each → hides logos from assistive tech entirely; rejected (branding matters to screen reader users too).

---

## Decision 4: Grid Column Count with 13 Logos

**Question**: The old grid had 9 logos on `grid-cols-3 md:grid-cols-4 lg:grid-cols-6`. The new grid has 13 logos. Does the layout need adjustment?

**Decision**: Retain the existing grid classes (`grid-cols-3 md:grid-cols-4 lg:grid-cols-6`).

**Rationale**:
- 13 logos on a 6-column desktop grid: row 1 fills (6 logos), row 2 fills (6 logos), row 3 has 1 logo — centered by flexbox/grid auto placement. This is visually acceptable for a sponsor strip.
- 13 logos on a 4-column tablet grid: 3 full rows + 1 logo. Fine.
- 13 logos on a 3-column mobile grid: 4 rows + 1 logo. Fine.
- Adding more columns would make logos too small at breakpoints.

**Alternatives considered**:
- `lg:grid-cols-7` → odd number, no visual benefit, breaks existing visual rhythm. Rejected.
- `lg:grid-cols-5` → slightly better last-row fill (3 rows of 5 + 1 partial) but no meaningful improvement. Rejected (stick with existing pattern).
