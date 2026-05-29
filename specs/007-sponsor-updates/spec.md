# Feature Specification: Sponsor Updates & AHS Presented-By Hero Placement

**Feature Branch**: `007-sponsor-updates`  
**Created**: 2026-05-29  
**Status**: Draft  
**Input**: User description: "we need to update our sponsors on the site. We have a folder in the images folder that has all the sponsors logs, and these need to replace the sponsors displayed currently on the home page. We also need to add the logo 2 to the top of the page, right under the big Beats on the Block logo. we need it to be front and center that we are presented by AHS"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AHS "Presented By" Placement in Hero (Priority: P1)

A visitor lands on the home page and immediately sees — right below the main Beats on the Block logo — a prominent "Presented by Advanced Health Solutions" badge. This makes the primary sponsorship unmistakably clear before they scroll anywhere.

**Why this priority**: AHS is the title/presenting sponsor. Burying or omitting this relationship undermines a key partnership. It must be the first thing visitors associate with the event after the event name itself.

**Independent Test**: Can be fully tested by loading the home page and confirming the AHS logo (logo 2) appears centered, below the BOTB logo, and above any event or hero card content — without any other sponsor changes deployed.

**Acceptance Scenarios**:

1. **Given** a visitor opens the home page on desktop, **When** the page loads, **Then** the AHS logo is visible directly beneath the Beats on the Block logo, centered, before any scrolling is required.
2. **Given** a visitor opens the home page on mobile, **When** the page loads, **Then** the AHS logo is visible and appropriately sized (not oversized, not so small it is illegible) in the hero area below the event branding.
3. **Given** the AHS logo image fails to load, **When** the page renders, **Then** a meaningful alt text ("Presented by Advanced Health Solutions") is displayed in place of the image.

---

### User Story 2 - Updated Sponsor Logos on Home Page (Priority: P2)

A visitor scrolling past the hero section sees the Sponsors section displaying the current 2026 sponsor logos (from the `Sponsor Logos 2026` image folder), replacing the old set of logos that were previously shown.

**Why this priority**: Showing outdated or incorrect sponsors is a contractual and reputational issue; accurate logos signal credibility to both attendees and sponsors.

**Independent Test**: Can be fully tested by scrolling to the Sponsors section and confirming each visible logo matches an image from the `Sponsor Logos 2026` folder, with no old logos remaining.

**Acceptance Scenarios**:

1. **Given** a visitor views the Sponsors section, **When** the section renders, **Then** only logos from the 2026 sponsor set are displayed (no old SVG logos remain).
2. **Given** the Sponsors section is displayed, **When** inspecting each logo, **Then** every logo is legible, properly sized, and not distorted.
3. **Given** a visitor views the page on any screen width (mobile, tablet, desktop), **When** the Sponsors section renders, **Then** logos are arranged in a responsive grid that does not overflow or clip.

---

### Edge Cases

- What happens if one of the 2026 sponsor logo images is missing or fails to load? The layout should not break; alt text should describe the sponsor.
- How does the AHS hero logo look alongside the existing BOTB logo glow effect? It should complement, not clash with, the existing hero visual design.
- What if the number of 2026 sponsor logos differs significantly from the old count? The grid layout must adapt gracefully for any count of logos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home page MUST display the AHS logo (image `2.png` from the `Sponsor Logos 2026` folder) in the hero section, positioned directly below the main Beats on the Block logo and above all other hero content.
- **FR-002**: The AHS hero logo MUST be centered horizontally and accompanied by alt text reading "Presented by Advanced Health Solutions".
- **FR-003**: The AHS hero logo MUST be visually prominent — large enough on desktop to be immediately readable, and appropriately scaled on mobile.
- **FR-004**: The Sponsors section on the home page MUST replace all existing logos with the logos from the `Sponsor Logos 2026` image folder (images 3–15, excluding image 2 which is reserved for the hero).
- **FR-005**: All 2026 sponsor logos in the Sponsors section MUST have descriptive alt text identifying each sponsor by name.
- **FR-006**: The Sponsors section layout MUST remain responsive across mobile, tablet, and desktop viewports.
- **FR-007**: No old sponsor logos from the previous `sponsors/` folder MUST remain visible on the home page after this change.

### Assumptions

- Images 3–15 in `Sponsor Logos 2026/` are the full set of 2026 sponsors to display in the Sponsors section (image 2 is the AHS presented-by logo used in the hero).
- Sponsor names/labels for alt text will be confirmed by the user or inferred from image filenames/context; if unnamed, generic alt text (`Sponsor [N]`) is used as a fallback.
- The existing grid layout in the Sponsors section is retained; only the logo images are swapped.
- No links are required for individual sponsor logos unless the user specifies otherwise.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every visitor to the home page sees the AHS "Presented by" logo in the hero section without scrolling, on both desktop and mobile.
- **SC-002**: The Sponsors section contains exactly the logos from the 2026 sponsor set — zero old logos remain.
- **SC-003**: All logos (hero and sponsors section) render without layout breakage across screen sizes from 375px to 1440px wide.
- **SC-004**: All images have non-empty alt text, ensuring the page remains accessible to screen reader users.
