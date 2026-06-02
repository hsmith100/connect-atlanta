# Feature Specification: Rebrand Site Colors and Fonts

**Feature Branch**: `001-rebrand-colors-fonts`  
**Created**: 2026-05-27  
**Status**: Draft  
**Input**: User description: "we need to finish up our rebrand, we have a rebranding, we have done the logos, but we need to update the colors and fonts on the site now. I am including the branding kit. /Users/huntersmith/Downloads/Final Brand Elements"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Site Visitor Experiences Updated Brand Identity (Priority: P1)

A visitor lands on the Beats on the Block website and the entire visual presentation — colors, typography, and UI elements — reflects the new official brand identity rather than the legacy color palette.

**Why this priority**: This is the core goal of the rebrand. Without the correct colors and fonts applied site-wide, the new logos already in place are inconsistent with the rest of the visual design. This is the highest-impact visible change.

**Independent Test**: Can be fully tested by visiting every page of the site and confirming that brand colors (Sunkiss Yellow, Pulse Pink, Open Sky Aqua, Valley Green, Relaxed Tan, Off White, and Black) and updated typography appear correctly throughout.

**Acceptance Scenarios**:

1. **Given** a visitor loads the home page, **When** they view the hero section, **Then** the background, text, and CTA buttons use official brand colors — no legacy gold (#F7C03E), cyan (#18B4DD), or off-brand pinks (#F81889).
2. **Given** a visitor reads body copy anywhere on the site, **When** the page loads, **Then** body text renders in Avenir Next (or an approved fallback) at appropriate sizes and weights.
3. **Given** a visitor views any section heading, **When** the page loads, **Then** headings render in Bricolage Grotesque.
4. **Given** a visitor views any logo, wordmark, or hero display title, **When** the page loads, **Then** those elements render in Anton.

---

### User Story 2 - Typography Hierarchy Is Clear and Consistent (Priority: P2)

The three-font system — Anton for logo/display, Bricolage Grotesque for headlines, Avenir Next for body — is consistently applied across all pages so that visual hierarchy guides the reader naturally.

**Why this priority**: Correct typography application is a prerequisite for brand consistency. Mismatched font assignments (e.g., headlines still in Montserrat or Bebas Neue) would undermine the rebrand even if colors are correct.

**Independent Test**: Can be tested by inspecting any page with a heading, subheading, and body paragraph, and confirming all three font roles map to the correct typeface.

**Acceptance Scenarios**:

1. **Given** any page with a hero title, **When** the page renders, **Then** the title uses Anton.
2. **Given** any page with section headings (H1–H3), **When** the page renders, **Then** headings use Bricolage Grotesque.
3. **Given** any page with paragraph text, **When** the page renders, **Then** body text uses Avenir Next.
4. **Given** a font fails to load, **When** the page renders, **Then** a visually similar fallback font is displayed and the page remains readable.

---

### User Story 3 - Interactive Elements Reflect New Brand Colors (Priority: P3)

Buttons, links, hover states, focus rings, and other interactive UI elements use the new official brand color palette, replacing any hardcoded legacy colors.

**Why this priority**: Interactive elements are seen on every user action. Outdated colors on buttons or hover states would make the rebrand feel incomplete even after body colors and fonts are updated.

**Independent Test**: Can be tested by hovering over buttons and links on each page and confirming colors match the new palette.

**Acceptance Scenarios**:

1. **Given** a primary call-to-action button, **When** a visitor views it, **Then** the button uses official brand colors for background, text, and border.
2. **Given** a primary CTA button, **When** a visitor hovers over it, **Then** the hover state uses an approved brand color variant (e.g., a darker shade of the primary color).
3. **Given** any link or interactive text element, **When** a visitor interacts with it, **Then** the color reflects the new palette rather than legacy values.

---

### Edge Cases

- What happens when Avenir Next fails to load on a non-Apple device? (Font must have a system-font or web-font fallback defined)
- How does the site render if Bricolage Grotesque fails to load? (Fallback font must maintain readability and visual hierarchy)
- Are any brand colors used in gradients or glow effects in globals.css? (All hardcoded hex values in custom utilities must be audited and updated)
- What is the color contrast ratio for text on each new background color? (Must meet WCAG AA at minimum for accessibility)
- Are there any inline styles or component-level hardcoded colors that bypass the design system? (These must be found and replaced)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST apply Bricolage Grotesque as the typeface for all H1–H6 headings site-wide.
- **FR-002**: The site MUST apply Avenir Next as the typeface for all body copy, labels, and UI text site-wide.
- **FR-003**: Anton MUST be applied to logo wordmarks, hero display titles, and any text element previously using a logo-matching display font.
- **FR-004**: All legacy fonts (Montserrat, Bebas Neue, Horizon, Aharoni Bold) MUST be removed from font definitions and no longer referenced anywhere in the codebase.
- **FR-005**: The brand color palette MUST be updated to the following official Beats on the Block colors (extracted from brand kit PDF XMP metadata and logo assets):
  - **Sunkiss Yellow**: `#FCBC3A`
  - **Pulse Pink**: `#EA4E9A`
  - **Open Sky Aqua**: `#40BCB7`
  - **Valley Green**: `#3AAA45`
  - **Relaxed Tan**: `#FEEAD6`
  - **Off White**: `#FAF5F0`
  - **Black**: `#000000`
- **FR-006**: All occurrences of legacy brand colors (e.g., #F7C03E gold, #18B4DD cyan, #F81889 pink, #8C52FF purple) MUST be replaced with the corresponding official brand color equivalents throughout the design system and any component-level inline styles.
- **FR-007**: The site's theming system MUST be updated so primary, secondary, accent, and base color roles map to the new palette.
- **FR-008**: Avenir Next MUST be self-hosted using the `.ttc` file provided in the brand kit, as it is not freely available via web font services.
- **FR-009**: Bricolage Grotesque MUST be loaded from the variable font file provided in the brand kit, supporting the full weight range used on the site.
- **FR-010**: Anton MUST be loaded from the `.ttf` file provided in the brand kit.
- **FR-011**: All font loading MUST use a swap display strategy to prevent invisible text during load.
- **FR-012**: Text color contrast for all foreground/background color pairings MUST meet WCAG AA (4.5:1 for normal text, 3:1 for large text).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every page on the site renders with zero visible instances of legacy brand colors (gold #F7C03E, cyan #18B4DD, legacy pink #F81889, purple #8C52FF) when viewed in a browser.
- **SC-002**: Every page renders all three brand typefaces — Anton, Bricolage Grotesque, Avenir Next — correctly assigned to their respective roles, with no legacy font families (Montserrat, Bebas Neue, Horizon, Aharoni) appearing in computed font styles.
- **SC-003**: The site loads and displays correctly on both macOS/iOS (where Avenir Next may be a system font) and Windows/Android (where it is not), with no invisible or unstyled text during font load.
- **SC-004**: All foreground/background color combinations pass WCAG AA contrast validation with no failures.
- **SC-005**: The visual design is internally consistent — no page or section looks visually out-of-place compared to the rest of the site after the update.

## Assumptions

- The logos have already been updated separately; this feature covers only colors and typography.
- The brand color hex values were extracted from XMP metadata embedded in the brand PDF and confirmed against the provided logo PNG assets.
- Avenir Next will be self-hosted using the `.ttc` file in the brand kit rather than relying on system font availability, ensuring consistent rendering across all devices and operating systems.
- Bricolage Grotesque will use the variable font `.ttf` from the brand kit, which covers all weights needed.
- Anton will self-host using `Anton-Regular.ttf` from the brand kit (a single weight is sufficient — Anton is only available in Regular).
- The three named font roles map as follows: Anton = logo/display/hero titles; Bricolage Grotesque = all H1–H6 headings; Avenir Next = all body copy, labels, and UI text.
- No new pages or content are being added — this is a visual update to existing pages only.
- The legacy font family tokens (festival, slogan, logo, horizon) will be replaced or remapped to the new brand typefaces.
