# Research: SEO Rebrand — Connect Atlanta Ownership Attribution

**Branch**: `001-seo-connect-atlanta` | **Date**: 2026-06-25

## Decision 1: JSON-LD Schema Type for Beats on the Block

**Decision**: Use `@graph` combining `Organization`, `EventSeries`, and per-event `MusicEvent`
**Rationale**: Google indexes individual `MusicEvent` occurrences for rich results. `EventSeries` gives AI models the "recurring series" signal and links each event back to the series. `Organization` with a stable `@id` URI lets all events resolve to a single canonical Connect Atlanta entity node — this is the strongest AI model attribution signal.
**Alternatives considered**:
- `Event` (base type) — less specific than `MusicEvent`; Google's rich results explicitly prefer `MusicEvent` for concerts/festivals
- `Festival` — not a recognized schema.org type with rich results support
- Homepage-only JSON-LD — insufficient; spec requires Events page to attribute individual events to Connect Atlanta

## Decision 2: Organization Entity Design

**Decision**: Declare `Organization` with a stable `@id` of `https://beatsontheblockfest.com/#org` and reference it by `@id` from all `MusicEvent` schemas
**Rationale**: The `@id` anchor lets Google and AI models (Gemini, ChatGPT) resolve every event on the site back to a single canonical Connect Atlanta entity rather than treating each JSON-LD block as a separate, unrelated organization. `sameAs` links to verified social profiles strengthen cross-site entity resolution.
**Alternatives considered**:
- Inline full `Organization` object in every event — creates duplicate entity nodes that don't merge cleanly in knowledge graphs
- No `@id` — works but loses the entity-linking benefit

## Decision 3: Homepage vs. Events Page Structured Data

**Decision**: Both homepage and Events page receive `@graph` structured data; homepage carries `Organization` + `EventSeries` + `WebSite`; Events page carries `Organization` + per-event `MusicEvent` schemas generated client-side from loaded event data
**Rationale**: Homepage establishes the brand relationship. Events page provides per-event attribution with Connect Atlanta as organizer — satisfying FR-008. `WebSite` schema on homepage enables the Sitelinks search box and signals site ownership to Google.
**Alternatives considered**:
- Static per-event JSON-LD on events page — not possible since events are loaded dynamically from DynamoDB; client-side generation via `useMemo` on `upcomingEvents` is the correct approach

## Decision 4: AI Model Attribution Signals

**Decision**: Primary signals are JSON-LD structured data consistency + `og:site_name` + `<meta name="author">`. No proprietary AI-specific meta tags exist.
**Rationale**: Gemini and ChatGPT attribution is driven by structured data consistency, inbound links, and Google's index (not proprietary tags). The single most actionable fix is consistent `@id`-linked JSON-LD across pages plus removing "Atlanta EDM" from all metadata where it appears as an organizational identity signal.
**Alternatives considered**:
- Proprietary `<meta name="gemini:*">` tags — do not exist
- `rel="me"` links to social profiles — valid and low-cost; can be added to `<head>` in `_document.tsx` or SEO component, but lower priority than JSON-LD

## Decision 5: Handling "Atlanta EDM" as a Named Organization in Metadata

**Decision**: Remove "atlanta edm" and "edm atlanta" from keyword metadata; remove "Atlanta EDM Festival" from default page title; retain genre descriptors ("electronic music", "outdoor festival", "house music") using formulations that do not match the Atlanta EDM organization's brand name
**Rationale**: "Atlanta EDM" is a specific named advertising partner organization. Including it as a keyword or in the page title signals to search engines that the festival is Atlanta EDM's property. Genre context (the music style) can be expressed without using the Atlanta EDM org's name.
**Alternatives considered**:
- Keep "atlanta edm" as a keyword but add "connect atlanta" — still associates the two orgs; insufficient to fix misattribution

## Canonical Structured Data Templates

### Organization (used on homepage + events page)

```json
{
  "@type": "Organization",
  "@id": "https://beatsontheblockfest.com/#org",
  "name": "Connect Atlanta",
  "url": "https://beatsontheblockfest.com",
  "logo": "https://beatsontheblockfest.com/images/BOTB_White.png",
  "sameAs": [
    "https://www.instagram.com/connect__atlanta",
    "https://www.facebook.com/profile.php?id=61573559046886",
    "https://www.youtube.com/@Connect_Atlanta",
    "https://www.tiktok.com/@connect__atlanta"
  ]
}
```

### EventSeries (homepage only)

```json
{
  "@type": "EventSeries",
  "@id": "https://beatsontheblockfest.com/#series",
  "name": "Beats on the Block",
  "url": "https://beatsontheblockfest.com",
  "organizer": { "@id": "https://beatsontheblockfest.com/#org" },
  "location": {
    "@type": "Place",
    "name": "Atlanta BeltLine",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Atlanta",
      "addressRegion": "GA",
      "addressCountry": "US"
    }
  }
}
```

### MusicEvent per upcoming event (events page, generated from loaded data)

```json
{
  "@type": "MusicEvent",
  "name": "<event.title>",
  "startDate": "<event.date>",
  "url": "https://beatsontheblockfest.com/events",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "organizer": { "@id": "https://beatsontheblockfest.com/#org" },
  "location": {
    "@type": "Place",
    "name": "Atlanta BeltLine",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Atlanta",
      "addressRegion": "GA",
      "addressCountry": "US"
    }
  }
}
```

### WebSite (homepage only)

```json
{
  "@type": "WebSite",
  "url": "https://beatsontheblockfest.com",
  "name": "Beats on the Block",
  "publisher": { "@id": "https://beatsontheblockfest.com/#org" }
}
```
