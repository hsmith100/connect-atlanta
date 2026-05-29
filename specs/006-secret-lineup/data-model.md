# Data Model: Secret Lineup Reveal Page

**Feature**: 006-secret-lineup  
**Date**: 2026-05-29

## Summary

This feature involves **no data model changes**. The secret lineup page is entirely static — it has no database reads or writes, no DynamoDB tables, no Lambda handlers, and no API routes.

## Static Assets (not a data model, but the closest equivalent)

| Asset | Source | Path in Repo | Notes |
|-------|--------|-------------|-------|
| Logo 2 (AHS) | User-supplied | `frontend/public/images/Logo/<filename>` | Must be provided before deploy |
| lineup.png | User-supplied | `frontend/public/images/lineup.png` | Must be provided before deploy |

Both assets are bundled into the Next.js static export at build time and served from CloudFront alongside the rest of the frontend.
