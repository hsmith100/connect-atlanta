# Feature Specification: SEO Rebrand — Connect Atlanta Ownership Attribution

**Feature Branch**: `001-seo-connect-atlanta`
**Created**: 2026-06-25
**Status**: Draft
**Input**: User description: "we need the SEO of the website to be better associated with Connect Atlanta. Right now I believe search engines associate the festival with Atlanta EDM, but we want it to be closer associated with us in Connect Atlanta."

## Clarifications

### Session 2026-06-25

- Q: Should Beats on the Block or Connect Atlanta be the primary search identity? → A: Beats on the Block is the primary search identity; Connect Atlanta is the owner/organizer attribution signal
- Q: Does the scope include structured data for AI model attribution (Gemini, ChatGPT, etc.)? → A: Yes — AI models that scrape the site should recognize Connect Atlanta as the owner, not "Atlanta EDM"
- Q: What is the canonical organizational name for all ownership attribution? → A: "Connect Atlanta" — it is the only name for the group that owns Beats on the Block
- Q: Which pages should receive structured data for AI model attribution? → A: Homepage + Events pages (organization-level ownership on home; per-event attribution on events)
- Q: Is "Atlanta EDM" a genre description or a named organization? → A: Atlanta EDM is a specific named advertising partner organization — not a genre label. The site's metadata must not imply the festival is owned by or part of Atlanta EDM.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Search Correctly Attributes Beats on the Block to Connect Atlanta, Not Atlanta EDM (Priority: P1)

A potential sponsor, partner, or festival-goer researches the festival and finds that both search engines and AI models (Gemini, ChatGPT, Perplexity) correctly identify Connect Atlanta as the organizer of Beats on the Block — not Atlanta EDM, which is a separate advertising partner organization.

**Why this priority**: The current default page title contains "Atlanta EDM Festival" and keyword metadata contains "atlanta edm" and "edm atlanta" — terms that directly associate the festival with the Atlanta EDM organization rather than Connect Atlanta. This is the root cause of the misattribution.

**Independent Test**: Can be tested by: (1) inspecting the site's `<title>` tag, meta keywords, and structured data and confirming no reference to "Atlanta EDM" appears in ownership/identity context; (2) asking an AI assistant "who organizes Beats on the Block" and verifying it returns Connect Atlanta, not Atlanta EDM.

**Acceptance Scenarios**:

1. **Given** a search engine or AI model scrapes the site, **When** it reads the page title and metadata, **Then** the festival is attributed to Connect Atlanta — "Atlanta EDM" does not appear as an identity or ownership signal
2. **Given** a user asks an AI assistant "who puts on Beats on the Block?", **When** the AI responds based on scraped site data, **Then** the answer references Connect Atlanta as the organizer, not Atlanta EDM
3. **Given** a sponsor researches the festival, **When** they search "Beats on the Block organizer", **Then** results correctly attribute the festival to Connect Atlanta, not Atlanta EDM

---

### User Story 2 — No Page Title or Default Metadata Implies Atlanta EDM Ownership (Priority: P2)

Every page on the site presents Beats on the Block as a Connect Atlanta-produced festival. No title, description, or keyword metadata contains "Atlanta EDM" in a context that implies ownership or organizational identity.

**Why this priority**: "Atlanta EDM Festival" is the current default `<title>` tag on every page that does not override it — making every crawled page a signal that Atlanta EDM owns or is Beats on the Block. This must be corrected site-wide, not just on the homepage.

**Independent Test**: Can be tested immediately on deploy by inspecting the `<title>` tag and keyword metadata on each public page — "Atlanta EDM" must not appear as part of the festival's own identity on any page.

**Acceptance Scenarios**:

1. **Given** a search engine crawls any page using the default SEO fallback title, **When** it reads the title, **Then** "Atlanta EDM Festival" does not appear
2. **Given** the keyword metadata on any page, **When** reviewed, **Then** "atlanta edm" and "edm atlanta" do not appear as keywords that would signal Atlanta EDM is the owner
3. **Given** a user shares any page on social media, **When** the link preview loads, **Then** the preview identifies Connect Atlanta — not Atlanta EDM — as the organizing brand

---

### User Story 3 — Page-Level Titles Reinforce Beats on the Block Identity and Connect Atlanta Attribution (Priority: P3)

Every public page has a title leading with "Beats on the Block" and a description that names Connect Atlanta as the organizer, providing consistent positive attribution across all crawled pages.

**Why this priority**: Removing the wrong signal (Atlanta EDM) must be paired with adding the correct signal (Connect Atlanta) so search engines and AI models have an unambiguous authoritative source to attribute the festival to.

**Independent Test**: Can be tested by inspecting the `<title>` and `<meta name="description">` on all 12 public pages — each must lead with "Beats on the Block" and name Connect Atlanta in the description.

**Acceptance Scenarios**:

1. **Given** search results show a page title, **When** a user sees it, **Then** "Beats on the Block" is the primary name and "Atlanta EDM" does not appear
2. **Given** a page description, **When** a search engine or AI reads it, **Then** Connect Atlanta is named as the organizer or producing organization
3. **Given** all 12 public pages are reviewed, **When** each title and description is read, **Then** none reference "Atlanta EDM" in an identity context and all attribute the event to Connect Atlanta

---

### Edge Cases

- Pages with custom per-page titles (home, events, gallery, join, contact, merch, sponsor inquiries) each need individual updates — the default fallback fix alone is not sufficient.
- AI models prioritize structured data (JSON-LD) over plain meta tags — if structured data is absent, attribution may still default to scraped page text that could reference Atlanta EDM as a partner.
- Atlanta EDM is an advertising partner — if they are mentioned in visible page content (e.g., partner/sponsor sections), that content is acceptable and out of scope for this feature. The fix targets only SEO metadata and structured data where Atlanta EDM appears as an organizational identity signal for the festival itself.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The default page title MUST NOT contain "Atlanta EDM Festival" — this phrase directly names a separate advertising partner organization (Atlanta EDM) as the festival's identity
- **FR-002**: The default page title MUST lead with "Beats on the Block" as the primary identity and reference Connect Atlanta as the organizing brand
- **FR-003**: The default meta description MUST name Connect Atlanta as the organizer or producing organization of Beats on the Block
- **FR-004**: The `author` meta tag MUST be set to "Connect Atlanta"
- **FR-005**: The keyword metadata MUST include "connect atlanta" as an explicit term
- **FR-006**: The keyword metadata MUST NOT contain "atlanta edm" or "edm atlanta" — these terms reference the Atlanta EDM partner organization and must not appear as keywords for the festival's own identity
- **FR-007**: Structured data (machine-readable metadata) MUST be present on the homepage identifying Connect Atlanta as the organizer of the Beats on the Block event series — enabling AI models to attribute ownership correctly
- **FR-008**: Structured data MUST also be present on the Events page(s), attributing each individual Beats on the Block event to Connect Atlanta as the organizer
- **FR-009**: All 12 public-facing pages (home, events, gallery, join, contact, merch, sponsor-inquiries, cookie-policy, privacy-policy, terms-conditions, 404, about) MUST have per-page titles that lead with "Beats on the Block" and descriptions that name Connect Atlanta as the organizer
- **FR-010**: The `og:site_name` property MUST be set to "Connect Atlanta"

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero public-facing pages contain "Atlanta EDM Festival" in their title, description, or keyword metadata — verifiable immediately on deploy via page source inspection
- **SC-002**: Zero pages contain "atlanta edm" or "edm atlanta" in keyword metadata — verifiable immediately on deploy
- **SC-003**: All 12 public pages have titles that lead with "Beats on the Block" and descriptions that name Connect Atlanta as the organizer — verifiable immediately on deploy
- **SC-004**: Structured data on the homepage and Events page(s) explicitly names Connect Atlanta as the event organizer — verifiable immediately via structured data testing tools
- **SC-005**: Querying an AI assistant "who organizes Beats on the Block" returns Connect Atlanta (not Atlanta EDM) as the answer within 4–8 weeks of deployment

## Assumptions

- "Beats on the Block" is the audience-facing event name and primary search identity; "Connect Atlanta" is the organizing brand/owner
- "Atlanta EDM" is a named advertising partner organization — not a genre label. References to Atlanta EDM in visible partner/sponsor page content are acceptable and out of scope; only metadata and structured data are in scope.
- Genre context ("electronic music", "outdoor festival", "DJs", "house music") should be retained in descriptions — the goal is to remove the Atlanta EDM organizational signal and add Connect Atlanta attribution, not eliminate genre context
- AI model attribution is primarily driven by structured data (JSON-LD) and meta tags — both are in scope
- The canonical domain and redirect infrastructure do not need to change as part of this feature
- "Connect Atlanta" is the sole canonical organizational name — "Connect Events" (the prior value in `og:site_name` and `author` meta) is replaced by "Connect Atlanta" throughout
