# Feature Specification: Secret Lineup Reveal Page

**Feature Branch**: `006-secret-lineup`  
**Created**: 2026-05-29  
**Status**: Draft  
**Input**: User description: "Secret page revealing the final lineup, with AHS sponsor blurb and logo, accessible via direct link but not in main navigation. Link distribution is managed externally and is out of scope for this feature."

## Clarifications

### Session 2026-05-29

- Q: Will the link to this page be distributed via outbound emails sent by this project? → A: No. Email distribution is explicitly out of scope. The team will not include this link in any outbound emails managed by this system. Link sharing will be handled externally.
- Q: Should the secret lineup page be blocked from search engine indexing? → A: Yes — block indexing (noindex). The page must not appear in search engine results; it should only be findable via a directly shared link.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor Views Secret Lineup via Shared Link (Priority: P1)

A fan receives the private page URL through an external channel (e.g., shared by the organizers outside of this system) and navigates directly to the secret lineup page. They land on the page, read the AHS sponsor section, and then see the full lineup image — getting the exclusive early reveal.

**Why this priority**: This is the core value of the feature — delivering an exclusive lineup reveal and sponsor exposure to anyone who has been given the link.

**Independent Test**: Can be fully tested by navigating directly to `/secret-lineup` and verifying that the AHS logo, sponsor blurb, AHS link, and lineup image all render correctly.

**Acceptance Scenarios**:

1. **Given** a user has the private page URL, **When** they navigate to the page, **Then** they see the page title "Secret Lineup", the AHS "presented by" logo, the sponsor blurb, a link to ahsdoctors.com, and the final lineup image — all without needing to log in.
2. **Given** a user visits the main site navigation, **When** they browse all menu items, **Then** the secret lineup page does not appear as a navigation link.
3. **Given** a user on the secret lineup page clicks the AHS link, **When** the link is activated, **Then** the ahsdoctors.com site opens in a new browser tab.

---

### User Story 2 - Page Is Discoverable Only via Direct Link (Priority: P2)

The page exists at a stable, shareable URL but is intentionally omitted from the site's main navigation so that only those with the direct link can find it.

**Why this priority**: The exclusivity mechanic creates buzz. The page must be accessible (for sharing) but not prominently surfaced from the site itself.

**Independent Test**: Verify the page renders at its URL independently of any email flow, confirming it is a live page that simply isn't linked in the nav.

**Acceptance Scenarios**:

1. **Given** the page URL is known, **When** any visitor navigates directly to it, **Then** the page loads and displays all content normally (no login wall, no access restriction).
2. **Given** the site header/footer is rendered on any page, **When** a user inspects all navigation links, **Then** no link to the secret lineup page is present.

---

### User Story 3 - Sponsor Exposure for AHS (Priority: P3)

AHS gains brand visibility to the engaged Beats on the Block audience through prominent placement of their logo and a compelling description of their services, with a direct link to their site.

**Why this priority**: Sponsor satisfaction is a secondary goal, but delivering on partnership commitments is important for the organization's relationships and future funding.

**Independent Test**: Confirm the AHS logo, full sponsor blurb text, and clickable link to ahsdoctors.com appear correctly on the page.

**Acceptance Scenarios**:

1. **Given** the page loads, **When** a user reads the sponsor section, **Then** the exact sponsor blurb text is displayed verbatim as provided, with no truncation.
2. **Given** the sponsor section is visible, **When** a user clicks the AHS link, **Then** they are taken to ahsdoctors.com in a new tab.
3. **Given** the page loads, **When** a user views the top of the page, **Then** Logo 2 (the "Presented by AHS" variant) is displayed prominently beneath the page title.

---

### Edge Cases

- What happens when the `lineup.png` image fails to load? The page should still render with the sponsor section visible, and the image area should show a meaningful fallback (e.g., alt text).
- What if a user shares the URL publicly (e.g., on social media)? The page is accessible to anyone with the link — this is acceptable by design. No access control is required.
- What if the lineup image file is large? The image should be displayed at a reasonable width for all screen sizes without breaking the layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST include a new page accessible at a stable, direct URL (e.g., `/secret-lineup`) that is not linked in the main navigation menu or footer.
- **FR-002**: The page MUST display the title "Secret Lineup" as the primary heading.
- **FR-003**: The page MUST display Logo 2 (the "Presented by AHS" logo variant) prominently below the page title.
- **FR-004**: The page MUST display the following sponsor blurb verbatim:

  > At Beats on the Block, we are all about creating free spaces where our community can dance, connect, and thrive together. To take that community first mission to the next level, we're thrilled to partner with Advanced Health Solutions!
  >
  > AHS is a premier personal injury and wellness practice dedicated to keeping you moving stress free. If life ever throws an accident your way, their patient first model provides complete medical and legal care with zero out of pocket costs.
  > You pay nothing unless you win your case! Together, we've got your back, on and off the dance floor.
  >
  > Check them out! They are pretty cool if you ask us.

- **FR-005**: The page MUST include a hyperlink to `https://ahsdoctors.com` that opens in a new browser tab, placed after the sponsor blurb.
- **FR-006**: The page MUST display the `lineup.png` image below the AHS sponsor section.
- **FR-007**: The page MUST NOT appear in any site navigation menus (header, footer, mobile nav, sitemap links).
- **FR-008**: The page MUST be accessible to any visitor who has the direct URL — no authentication or login is required.
- **FR-010**: The page MUST include a search engine noindex directive so that it does not appear in any search engine results.
- **FR-009**: The lineup image MUST include descriptive alt text for accessibility.

### Key Entities

- **Secret Lineup Page**: A standalone page at a fixed URL containing the sponsor section and lineup image. No associated data storage required — entirely static content.
- **Logo 2 (AHS variant)**: An existing image asset in the project (`logo2`) that reads "Presented by AHS". Used as the page header logo.
- **Lineup Image**: A static image file (`lineup.png`) representing the finalized performer lineup, placed in the public/static assets directory.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The secret lineup page loads and displays all content (title, logo, sponsor blurb, AHS link, lineup image) when accessed via its direct URL.
- **SC-002**: Zero navigation menus or links across the site point to the secret lineup page.
- **SC-003**: The AHS link opens `ahsdoctors.com` in a new browser tab 100% of the time when clicked.
- **SC-004**: The page is viewable on both mobile and desktop screen sizes without horizontal scrolling or content overflow.
- **SC-005**: The lineup image renders at full quality and is accessible via alt text on all supported browsers.

## Assumptions

- **Logo 2 asset exists**: There is already a "logo2" image in the project's asset directory that shows the "Presented by AHS" branding. If it doesn't exist, it will need to be added before implementation.
- **lineup.png will be provided**: The final lineup image file (`lineup.png`) will be supplied by the user and placed in the project's public/static assets before or during implementation.
- **Page URL**: The page will live at `/secret-lineup`. This is descriptive, easy to share externally, and consistent with the site's existing URL conventions.
- **Email distribution out of scope**: This project will not send or manage any outbound emails linking to this page. How the URL gets distributed to fans is handled entirely outside this system.
- **No password protection**: The page relies on obscurity (no nav link) rather than a technical access control mechanism. Anyone with the URL can view it.
- **Existing site layout**: The page will use the same site layout (fonts, background, overall style) as other pages on the site, with the AHS section styled to feel at home within the Beats on the Block brand.
- **AHS link label**: The link text will be "Visit AHS at ahsdoctors.com" or similar natural phrasing — exact copy can be adjusted during implementation.
