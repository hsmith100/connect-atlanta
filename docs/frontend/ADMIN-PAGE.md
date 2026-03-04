# Admin Page — Architecture & Reference

The admin page lives at `/admin` and is protected by an admin key stored in Secrets Manager (one per environment). There is no separate login server — auth is handled entirely client-side via `localStorage`.

---

## File Structure

```
frontend/
  pages/
    admin.tsx                        ← Shell: auth state, tab nav, data loading
  components/
    admin/
      AuthGate.tsx                   ← Login form (verifies key against API)
      PhotoCard.tsx                  ← Single draggable/selectable photo card
      PhotosTab.tsx                  ← Photos tab: upload, reorder, visibility, delete
      EventsTab.tsx                  ← Events tab: create, flyer upload, go-live scheduler, delete
  lib/
    generateThumbnail.ts             ← Canvas API utility: resize to 600px wide JPEG
    api.ts                           ← All API calls (getAdminPhotos, getAdminEvents, presignFlyer, etc.)
```

---

## Auth Flow

1. On mount, `admin.tsx` checks `localStorage` for a saved key
2. If found, it verifies against `GET /api/admin/photos` — removes the key if the call fails (key rotated)
3. If no saved key, renders `AuthGate`
4. `AuthGate` verifies the key via `getAdminPhotos(input)` and calls `onAuth(key)` on success
5. `admin.tsx`'s `onAuth` handler does `localStorage.setItem(STORAGE_KEY, key)` — localStorage is owned by the page, not AuthGate
6. Sign-out removes the key from localStorage and sets `adminKey` back to `null`

**Key:** `connect_admin_key` in localStorage
**Secret retrieval:**
```bash
aws secretsmanager get-secret-value \
  --secret-id <AdminKeySecretArn output> \
  --query SecretString --output text
```

---

## Photos Tab (`PhotosTab.tsx`)

**Features:**
- Filter displayed photos by event
- Tag uploads to an event (sets `eventId` on each photo)
- Multi-file upload: generates thumbnail via Canvas API, PUTs both full + thumb to S3 via presigned URLs
- Drag-and-drop reorder (HTML5 drag API, `dragIndexRef`)
- Save order: writes `sortOrder` (i × 10) to all photos in one PATCH call
- Toggle visibility (optimistic update, reverts on error)
- Multi-select + bulk delete

**Upload flow:**
1. `POST /api/admin/photos/presign` → get presigned URLs for full + thumb
2. Canvas API → generate 600px JPEG thumbnail blob
3. `PUT` full image + thumbnail directly to S3
4. `POST /api/admin/photos` → create DynamoDB records
5. `GET /api/admin/photos` → refresh local state

---

## Events Tab (`EventsTab.tsx`)

**Features:**
- Create event with optional flyer, times, location, ticketing URL, go-live date
- Upload/replace flyer per event (timestamped S3 key avoids CloudFront cache)
- Go-live scheduler: sets `goLiveAt` ISO timestamp on the event; Lambda filters events where `goLiveAt <= now`
- Delete event (also deletes flyer from S3 via Lambda)

**Flyer upload flow:**
1. `POST /api/admin/flyers/presign` → get presigned URL + `flyerUrl` (key: `flyers/{eventId}-{timestamp}.{ext}`)
2. `PUT` file directly to S3 via presigned URL
3. `PATCH /api/admin/events/{id}` with `{ flyerUrl }` → Lambda reads old record, deletes old S3 object, updates DynamoDB

**Helper components (internal to EventsTab.tsx):**
- `toDatetimeLocal(iso)` — converts ISO string to `datetime-local` input value in local time
- `GoLiveBadge` — shows "Always live", "Live now", or "Scheduled: {datetime}" based on `goLiveAt`

---

## API Routes Used

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/admin/photos` | List all photos (auth required) |
| POST | `/api/admin/photos/presign` | Get presigned S3 URLs for upload |
| POST | `/api/admin/photos` | Create photo records in DynamoDB |
| PATCH | `/api/admin/photos` | Update sortOrder / visibility |
| DELETE | `/api/admin/photos` | Delete photos + S3 objects |
| GET | `/api/admin/events` | List all events (unfiltered, auth required) |
| POST | `/api/admin/events` | Create event |
| PATCH | `/api/admin/events/{id}` | Update flyerUrl / goLiveAt / ticketingUrl |
| DELETE | `/api/admin/events/{id}` | Delete event + S3 flyer |
| POST | `/api/admin/flyers/presign` | Get presigned URL for flyer upload |

All admin routes require the `x-admin-key` header.

---

## S3 Key Conventions

| Asset | Key pattern |
|-------|-------------|
| Full photo | `photos/{id}.{ext}` |
| Photo thumbnail | `photos/thumbs/{id}.{ext}` |
| Event flyer | `flyers/{eventId}-{timestamp}.{ext}` |

Flyers include a timestamp so each upload is a unique URL — prevents CloudFront from serving a cached old flyer after replacement.
