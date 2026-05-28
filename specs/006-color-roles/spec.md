# Feature Specification: Brand Color Role Assignments

**Feature Branch**: `006-color-roles`  
**Created**: 2026-05-27  
**Status**: Draft  
**Input**: User description: "Document brand color role decisions — Pulse Pink as interactive/highlight color, Sunkiss Yellow as background/gradient color"

## Overview

Codify the semantic roles of the two primary brand colors across the site. Pulse Pink (#EA4E9A) is the interactive and highlight color used for all clickable elements, indicators, and calls-to-action. Sunkiss Yellow (#FCBC3A) is the background and gradient color used for section fills and hero gradients. This prevents interactive elements from visually blending into warm-yellow backgrounds and ensures consistent brand expression.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visible Call-to-Action Buttons (Priority: P1)

A site visitor lands on any page with a hero section that has a warm golden background. They see primary action buttons rendered in Pulse Pink — visually distinct from the background — and can immediately identify them as interactive.

**Why this priority**: CTA visibility is the most direct driver of conversions. Yellow buttons on a yellow/tan gradient background were effectively invisible, making this the most urgent color-role fix.

**Independent Test**: Navigate to the home page. Confirm the primary CTA button background is Pulse Pink (#EA4E9A), not Sunkiss Yellow. Confirm button text is white and readable. Confirm the button is visually distinct from the hero gradient background.

**Acceptance Scenarios**:

1. **Given** any page with a golden hero gradient, **When** a visitor views the page, **Then** all primary CTA buttons appear in Pulse Pink with white text, clearly distinguishable from the background.
2. **Given** a primary CTA button, **When** a visitor hovers over it, **Then** the button darkens to a deeper pink (hover state), confirming it is interactive.
3. **Given** an outline-style secondary CTA button, **When** a visitor views it, **Then** the border and text are Pulse Pink, and hovering fills it with Pulse Pink and white text.

---

### User Story 2 - Consistent Interactive Element Highlighting (Priority: P2)

A site visitor interacts with forms, navigation tabs, and links throughout the site. All interactive and highlighted states use Pulse Pink consistently, rather than mixing pink and yellow across different components.

**Why this priority**: Color consistency across interactive elements reinforces the brand and reduces cognitive friction. Visitors saw yellow checkboxes, yellow tab indicators, and yellow email links — inconsistent with the pink CTA buttons established in US1.

**Independent Test**: Visit the /join page. Verify the active tab underline is Pulse Pink. Visit the /contact page. Verify email links render in Pulse Pink. Submit any form with a checkbox. Verify the checked state is Pulse Pink.

**Acceptance Scenarios**:

1. **Given** the Join page tab bar, **When** a visitor selects a tab, **Then** the active tab indicator (bottom border) renders in Pulse Pink, not yellow.
2. **Given** a page with email or external links, **When** a visitor views the links, **Then** link text renders in Pulse Pink.
3. **Given** a form with a checkbox or toggle, **When** a visitor checks it, **Then** the checked state renders in Pulse Pink.
4. **Given** any loading spinner or icon used as a primary indicator, **When** a visitor sees it, **Then** it renders in Pulse Pink.

---

### User Story 3 - Preserved Golden Backgrounds and Gradients (Priority: P3)

A site visitor experiences warm golden section backgrounds and hero gradients that use Sunkiss Yellow as intended, while no call-to-action or interactive element uses yellow as its primary color.

**Why this priority**: The golden warmth is a core brand aesthetic. The role shift only changes interactive elements to pink — backgrounds and gradient fills must remain golden to preserve the visual identity.

**Independent Test**: View the home page hero, about hero, and experience section. Confirm the gradient and background fills still use warm golden/yellow tones. Confirm no button, link, or interactive element uses yellow as its primary color.

**Acceptance Scenarios**:

1. **Given** any hero section, **When** a visitor views it, **Then** the section background uses the warm golden gradient (Relaxed Tan to Sunkiss Yellow), not pink.
2. **Given** any section with a yellow background fill (e.g., `bg-brand-primary`), **When** a visitor views it, **Then** the background remains yellow.
3. **Given** the full site, **When** a visitor navigates all pages, **Then** no call-to-action button, link, checkbox, or tab indicator uses yellow as its primary color.

---

### Edge Cases

- What happens when a new component is added that uses `text-brand-primary` or `border-brand-primary` for an interactive element? It will render yellow — new interactive elements must use `text-brand-pink` / `border-brand-pink` instead.
- What if a future designer wants yellow CTAs? The contrast ratio for white text on Sunkiss Yellow is 1.69:1 (WCAG AA fail for normal text, fail for large text). Dark text on yellow is 10.27:1 (pass). Any yellow CTA must use dark text to meet accessibility standards.
- What about gradient headings that blend pink and yellow? Text gradient headings (e.g., `from-brand-pink to-brand-primary`) are decorative and not interactive — they are exempt from the interactive-element rule. The `via-brand-peach` stop was removed to keep gradients two-color only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All primary call-to-action buttons MUST use Pulse Pink (#EA4E9A) as their background color.
- **FR-002**: All primary CTA buttons MUST display white (#FFFFFF) text to satisfy WCAG AA large text contrast (≥3:1) against the Pulse Pink background.
- **FR-003**: All interactive text links (email addresses, inline hyperlinks) MUST render in Pulse Pink.
- **FR-004**: All form checkboxes and toggles MUST display their checked/active state in Pulse Pink.
- **FR-005**: The active/selected state indicator for navigation tab bars (e.g., bottom border) MUST render in Pulse Pink.
- **FR-006**: All loading spinners and status icons used as primary indicators MUST render in Pulse Pink.
- **FR-007**: Section background fills and hero gradients MUST continue to use Sunkiss Yellow (#FCBC3A) as the warm-tone color; no background fill shall change to pink.
- **FR-008**: The DaisyUI `--color-primary` CSS variable MUST be set to Pulse Pink so that all DaisyUI form components (checkboxes, radios, toggles) inherit the correct brand color automatically.
- **FR-009**: A `brand-pink-dark` (#C83A82) token MUST exist and be used as the hover/active variant for Pulse Pink interactive elements.
- **FR-010**: Decorative text gradients on headings are exempt from the interactive-element color rule and may blend pink and yellow tones.

### Assumptions

- White on Pulse Pink (#EA4E9A) achieves approximately 3.3:1 contrast ratio, meeting WCAG AA for large text (≥18pt or ≥14pt bold). All CTA buttons use semibold weight at a size qualifying as large text.
- Dark text on Sunkiss Yellow (#FCBC3A) achieves 10.27:1 contrast ratio (WCAG AA pass). If any yellow-background interactive element must exist, it must use dark text.
- The site does not have a dark mode — all color decisions assume a light background context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every primary CTA button on every page is visually distinct from its surrounding background — zero cases where a yellow button appears on a yellow/tan background.
- **SC-002**: All interactive element highlight colors (links, checkboxes, tab indicators, spinners) are Pulse Pink — zero yellow highlights remain in interactive contexts.
- **SC-003**: All section background fills and hero gradients retain their warm golden palette — zero hero or section backgrounds have been changed to pink.
- **SC-004**: All tests pass with updated class names — zero snapshot failures or lint errors resulting from the color role changes.
- **SC-005**: WCAG AA contrast requirements are met for all CTA button text — white text on Pulse Pink achieves ≥3:1 for large text, dark text on any yellow interactive element achieves ≥4.5:1 for normal text.
