---
description: "Task list for 009-photo-store"
---

# Tasks: Event Photo Store

**Input**: Design documents from `/specs/009-photo-store/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/store-api.md, contracts/store-ui.md, quickstart.md

**Tests**: REQUIRED by constitution Principle X. Every new Lambda handler, lib utility and frontend component with logic gets a colocated test (`*.test.ts(x)` next to the source). Lambda: Jest + `aws-sdk-client-mock`, Stripe mocked with `jest.mock('stripe')`. Frontend: Jest + React Testing Library. CDK and purely presentational components are exempt. **End-to-end**: Playwright tests in `e2e/` cover the new public pages on every PR environment and on staging (`regression.spec.ts`), and a full Stripe test-mode purchase runs on every PR environment (`purchase.spec.ts`, T061–T063, T081).

**Organization**: Tasks are grouped by user story (spec.md US1–US6) so each story can be built and validated on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US6 from spec.md
- Paths are repo-relative: `lambda/`, `frontend/`, `infrastructure/`, `shared/types/`

## Conventions every task must follow

- Money is **integer cents**; format only in the UI via `formatMoney`.
- Admin handlers start with `const authErr = await requireAdmin(event); if (authErr) return authErr;` (from `lambda/src/lib/photoShared.ts`). Responses use `ok`/`errResponse` from the same file.
- Errors returned to users are human-readable `{ error }` strings (Principle XI). No `console.log`; use `console.error` only in catch blocks, as existing handlers do.
- Every async UI action shows a loading state and a readable error (Principle XI). Tailwind/DaisyUI only. Usable at 320px wide.
- Types come from `shared/types/store.ts`; never redeclare them in `lambda/` or `frontend/` (Principle IX).
- Await every SES and Stripe call (Principle VI). Stripe writes pass an `idempotencyKey`.
- Frontend store routes live under `/shop`. API routes live under `/api/store` and `/api/admin/store`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies and shared type definitions

- [ ] T001 Add `stripe` (latest major) to `dependencies` in `lambda/package.json` and run `npm install` in `lambda/` to update `lambda/package-lock.json`
- [ ] T002 [P] Create `shared/types/store.ts` with every type in data-model.md: `StoreCollection`, `CollectionStatus`, `DiscountTier`, `StoreSettings`, `StorePhoto`, `StorePhotoStatus`, `Photographer`, `StoreOrder`, `OrderStatus`, `OrderLine`, `PhotographerTransfer`, `TransferStatus`. Also add every request/response payload in contracts/store-api.md, including `PublicCollection` (with `eventId`), `PublicCollectionPage`, `PublicPhoto`, `CartQuoteRequest`, `CartQuote`, `CheckoutRequest` (including `turnstileToken`), `CheckoutResponse`, `OrderStatusResponse`, `DownloadsResponse`, `ResendRequest`, `StorePresignRequest`, `StorePresignResponse`, `StorePhotoCreatePayload`, `StorePhotoUpdatePayload`, `PhotographerEarnings`, `EarningsResponse`, `AdminOrdersResponse`. Exclude `originalKey`, `downloadTokenHashes` and `setupTokenHash` from public/admin response types where the contract says they're never returned.
- [ ] T003 [P] Create `frontend/lib/store/formatMoney.ts` (`formatMoney(cents: number): string` → `"$15.00"`) with `frontend/lib/store/formatMoney.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tables, bucket, secret, Lambda skeleton and shared libs that every story uses

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 In `infrastructure/lib/stacks/dynamo-stack.ts` add 4 public readonly tables per data-model.md, following the existing table pattern (`connect-${p}…`, PAY_PER_REQUEST, `removalPolicy`), plus a `CfnOutput` for each:
  - `storeCollectionsTable`: `connect-${p}store-collections`, GSI `byEventDate` (PK `entity` S, SK `eventDate` S)
  - `storePhotosTable`: `connect-${p}store-photos`, GSI `byCollection` (PK `collectionId` S, SK `sortOrder` N)
  - `storePhotographersTable`: `connect-${p}store-photographers`, no GSI
  - `storeOrdersTable`: `connect-${p}store-orders`, `timeToLiveAttribute: 'expiresAt'`, GSI `byCreatedAt` (PK `entity` S, SK `createdAt` S) and GSI `byEmail` (PK `buyerEmail` S, SK `createdAt` S)
- [ ] T005 In `infrastructure/lib/stacks/backend-stack.ts` add `StoreOriginalsBucket`: `BLOCK_ALL`, `RETAIN` (DESTROY + `autoDeleteObjects` when `ephemeral`), CORS PUT from `*` (same as MediaBucket), lifecycle rule transitioning to `INTELLIGENT_TIERING` after 30 days, and **no** CloudFront distribution or OAI. Add `CfnOutput` `StoreOriginalsBucketName`.
- [ ] T006 In `infrastructure/lib/stacks/backend-stack.ts` add the Stripe secret (research R8). Add two new props to `BackendStackProps`: `siteOriginMode?: 'prod' | 'any-cloudfront'` (default `'any-cloudfront'`) and `stripeSecretMode?: 'own' | 'devShared' | 'importDev'` (default `'own'`):
  - `'own'`: `new secretsmanager.Secret(this, 'StripeSecret', { generateSecretString: { excludePunctuation: true, passwordLength: 32 } })`
  - `'devShared'`: same, with `secretName: 'connect-dev-stripe'`
  - `'importDev'`: `secretsmanager.Secret.fromSecretNameV2(this, 'StripeSecret', 'connect-dev-stripe')`

  Add `CfnOutput` `StripeSecretArn` with the description `aws secretsmanager put-secret-value --secret-id <arn> --secret-string '{"secretKey":"sk_...","webhookSecret":"whsec_..."}'`.
- [ ] T007 In `infrastructure/bin/app.ts` pass `siteOriginMode: 'prod'` to `ConnectBackendStack` (prod only), `stripeSecretMode: 'devShared'` to `ConnectDevBackendStack`, and `stripeSecretMode: 'importDev'` to the PR `BackendStack`; staging keeps both defaults
- [ ] T008 In `infrastructure/lib/stacks/backend-stack.ts` add `StoreLambda` (`NodejsFunction`, entry `store.ts`, NODEJS_22_X, ARM_64, `memorySize: 512`, `timeout: 30s`, same `depsLockFilePath`) with environment:
  - `STORE_COLLECTIONS_TABLE`, `STORE_PHOTOS_TABLE`, `STORE_PHOTOGRAPHERS_TABLE`, `STORE_ORDERS_TABLE`, `EVENTS_TABLE`
  - `MEDIA_BUCKET`, `CLOUDFRONT_DOMAIN`, `ORIGINALS_BUCKET`
  - `ADMIN_SECRET_ARN`, `STRIPE_SECRET_ARN`, `TURNSTILE_SECRET_ARN`
  - `CONTACT_EMAIL`, `FROM_EMAIL: 'noreply@beatsontheblockfest.com'`, `SITE_ORIGIN_MODE` (from the new `siteOriginMode` prop, T007)

  Grants:
  - `grantReadWriteData` on the 4 store tables, `grantReadData` on `eventsTable`
  - `mediaBucket.grantReadWrite`, `storeOriginalsBucket.grantReadWrite`
  - `grantRead` on the admin, Stripe and Turnstile secrets
  - SES `ses:SendEmail` / `ses:SendRawEmail` policy (same as FormsLambda)

  Add `HttpLambdaIntegration('StoreIntegration', storeLambda)` and register routes `/api/store/{proxy+}` (GET, POST) and `/api/admin/store/{proxy+}` (GET, POST, PATCH, PUT, DELETE). Add `apigateway.CorsHttpMethod.PUT` to `corsPreflight.allowMethods`.
- [ ] T009 [P] Create `lambda/src/lib/storeShared.ts` with `lambda/src/lib/storeShared.test.ts`:
  - `ddb`, `s3`, `ses` clients; env constants for the T008 variables
  - `newId()`, `nowIso()`
  - `generateToken(prefix: string): { token: string; hash: string }`: `${prefix}.${randomBytes(32).toString('base64url')}`, hashing only the secret part with SHA-256 hex
  - `hashTokenSecret(token)` returning `{ prefix, hash }` or `null` when malformed
  - `isAllowedSiteUrl(url)` per research R9: in `prod` mode allow exactly `https://beatsontheblockfest.com`, `https://www.beatsontheblockfest.com`, `https://connectevents.co`, `https://www.connectevents.co`; in `any-cloudfront` mode also allow `https://*.cloudfront.net` and `http://localhost:3000`
  - `isValidEmail(email)` (basic pattern, ≤254 characters)
  - `parseJson<T>(event)` throwing on an invalid body
  - `sendEmail(to: string, subject: string, text: string)`, awaited, which rethrows so callers decide
  - `mediaUrl(key)`

  Tests cover token round-trip, malformed tokens, allowlist in both modes, and email validation.
- [ ] T010 [P] Create `lambda/src/lib/stripeClient.ts`: `getStripe(): Promise<Stripe | null>` reads `STRIPE_SECRET_ARN` JSON `{secretKey, webhookSecret}` once per cold start and returns `null` when `secretKey` doesn't start with `sk_` (placeholder). Also export `getWebhookSecret(): Promise<string | null>` and `export function __resetStripeCache()` for tests. Add `lambda/src/lib/stripeClient.test.ts` (placeholder → null, valid → client, cached).
- [ ] T011 Create `lambda/src/handlers/store.ts`, a thin router in the same style as `lambda/src/handlers/photos.ts`: method + `rawPath` matching with regexes for `{id}` segments, a try/catch that returns `errResponse(500, 'Internal server error')`, and a 404 fallback. Start with no routes; each story phase registers its routes here.
- [ ] T012 [P] Create `frontend/lib/api/store.ts` (public) and `frontend/lib/api/adminStore.ts` (admin, uses `adminHeaders`) as empty modules that import `fetchAPI` from `./client`, and re-export both from `frontend/lib/api/index.ts`. Later tasks add functions with colocated tests (`store.test.ts`, `adminStore.test.ts`) following `client.test.ts` mocking style.
- [ ] T013 Add a **Store** tab to `frontend/pages/admin.tsx` that renders a new `frontend/components/admin/store/StoreTab.tsx`. `StoreTab` has a sub-navigation in the same style as `frontend/components/admin/SubmissionsTab.tsx` with Collections, Upload, Orders, Photographers and Settings; each sub-section renders a placeholder until its story phase. Add `frontend/components/admin/store/StoreTab.test.tsx` (switching sub-sections).

**Checkpoint**: `cdk synth` succeeds; `cdk deploy ConnectDevDynamoStack ConnectDevBackendStack` (review changeset) creates the tables, bucket, secret and StoreLambda; any `/api/store/x` returns a 404 JSON body.

---

## Phase 3: User Story 1 - Admin Uploads and Prices Photos for Sale (Priority: P1) 🎯 MVP

**Goal**: Admin creates a collection for an event, adds photographers, bulk-uploads full-quality photos (watermarked preview and thumbnail generated in the browser), sets prices and publishes. Originals are never public.

**Independent Test**: quickstart.md steps 2–8 (with photographers created but Connect setup not required until US5): upload 20 photos, confirm previews are watermarked, originals are unreachable publicly, prices are saved, and drafts are hidden.

### Backend (US1)

- [ ] T014 [P] [US1] Create `lambda/src/handlers/adminStorePhotographers.ts` with `listPhotographers` (Scan), `createPhotographer` (validates name, email, `commissionPct` 0–100 with up to 2 decimals; sets `active: true`, `owedCents: 0`, `payoutsReady: false`, `stripeAccountId: null`) and `updatePhotographer` (partial `name`, `email`, `commissionPct`, `active`). Responses never include `setupTokenHash`. Add `adminStorePhotographers.test.ts`.
- [ ] T015 [P] [US1] Create `lambda/src/handlers/adminStoreCatalog.ts` collection functions:
  - `listCollections`: query `byEventDate` descending for entity `COLLECTION`
  - `createCollection`: body `{ eventId, defaultPriceCents, defaultPhotographerId? }`. Loads the event from `EVENTS_TABLE` (404 if missing), returns 409 if a collection for that `eventId` already exists, copies `title` from the event name and `eventDate` from the event `date`, sets `status: 'draft'` and `photoCount: 0`. Return 201.
  - `updateCollection`: partial `title`, `defaultPriceCents`, `defaultPhotographerId`, `coverPhotoId`, `status`
  - `deleteCollection`: 409 if the collection still has any photos; the admin deletes or removes them first

  Validate prices as integers ≥ 50. Publish preconditions (data-model.md) return `422 { error, problems: string[] }`: `defaultPriceCents > 0`, ≥1 `forSale` photo, every `forSale` photo has a `photographerId`. Add tests in `adminStoreCatalog.test.ts`.
- [ ] T016 [US1] In `lambda/src/handlers/adminStoreCatalog.ts` add photo functions:
  - `presignStorePhotos`: ≤50 items; `contentType` must be `image/jpeg` or `image/png`. Returns, per item:
    - `originalUploadUrl` (PUT to `ORIGINALS_BUCKET` key `originals/{id}.{ext}`)
    - `previewUploadUrl` and `thumbUploadUrl` (PUT to `MEDIA_BUCKET` keys `store/previews/{id}-{ts}.jpg` and `store/thumbs/{id}-{ts}.jpg`, `image/jpeg`)
    - `previewUrl`, `thumbnailUrl` (via `mediaUrl`) and `originalKey`
    - All URLs expire in 900s.
  - `listCollectionPhotos`: query `byCollection` with pagination loop, all statuses
  - `createStorePhotos`: for each payload, `HeadObject` on `originalKey` in `ORIGINALS_BUCKET` (400 if missing). Validate `photographerId` exists and is active. Put the item with `status: 'forSale'` and `priceOverrideCents: null`, then increment the collection `photoCount` by the number created (`UpdateCommand ADD`). Return 201.
  - `updateStorePhotos`: partial `sortOrder`, `status`, `priceOverrideCents` (null or integer ≥ 50) and `photographerId`, adjusting `photoCount` when status moves into or out of `forSale`
  - `deleteStorePhotos`: deletes the original, preview, thumbnail and record; decrements `photoCount`. The sold-photo guard is added in US6 (T082).

  Extend tests.
- [ ] T017 [US1] In `lambda/src/handlers/adminStoreCatalog.ts` add replace-original:
  - `presignReplace(id)`: same URL shape for the existing photo `id` with a new `{ts}`; the original key is reused
  - `completeReplace(id, body)`: update `previewUrl`, `thumbnailUrl`, `width`, `height`, `contentHash`, `originalFilename`, `originalBytes`, then delete the previous preview and thumbnail objects

  Extend tests.
- [ ] T018 [US1] Register US1 admin routes in `lambda/src/handlers/store.ts`:
  - `GET|POST /api/admin/store/photographers`
  - `PATCH /api/admin/store/photographers/{id}`
  - `GET|POST /api/admin/store/collections`
  - `PATCH|DELETE /api/admin/store/collections/{id}`
  - `GET /api/admin/store/collections/{id}/photos`
  - `POST /api/admin/store/photos/presign`
  - `POST|PATCH|DELETE /api/admin/store/photos`
  - `POST|PATCH /api/admin/store/photos/{id}/replace`

  Add `lambda/src/handlers/store.test.ts` covering routing to each handler and the 404 fallback.

### Frontend (US1)

- [ ] T019 [P] [US1] Create `frontend/lib/store/hashFile.ts` (`hashFile(file: File): Promise<string>` using `crypto.subtle.digest('SHA-256')`, hex) with `hashFile.test.ts`
- [ ] T020 [P] [US1] Create `frontend/lib/store/generateWatermarked.ts`, modeled on `frontend/lib/generateThumbnail.ts`. `generateWatermarked(file: File): Promise<{ preview: Blob; thumbnail: Blob; width: number; height: number }>`:
  - Decode with `createImageBitmap(file)`
  - Draw a preview with a 1600px long edge and a thumbnail 600px wide (JPEG, quality 0.82 and 0.8)
  - Tile the text "BEATS ON THE BLOCK" diagonally (−30°) every ~300px: white fill at 0.30 alpha with a black 0.15-alpha stroke; font `bold <size>px` of the site display font if loaded, else `sans-serif`, scaled to ~6% of the canvas width
  - Close the bitmap
  - Reject with a readable `Error` on decode failure

  Add `generateWatermarked.test.ts` with mocked canvas and `createImageBitmap`, asserting the output sizes and that `fillText` is called multiple times.
- [ ] T021 [US1] Add US1 admin API functions to `frontend/lib/api/adminStore.ts`: photographers (list, create, update); collections (list, create, update, delete); `getCollectionPhotos`; `presignStorePhotos`; `createStorePhotos`; `updateStorePhotos`; `deleteStorePhotos`; `presignReplace`; `completeReplace`. Add tests in `adminStore.test.ts`.
- [ ] T022 [US1] Create `frontend/components/admin/store/PhotographersSection.tsx` with a list table (name, email, commission %, active badge), an add form, and inline edit/deactivate. Add `PhotographersSection.test.tsx`. Payment status badges and setup actions come in US5.
- [ ] T023 [US1] Create `frontend/components/admin/store/StoreUploader.tsx` with `StoreUploader.test.tsx`:
  - **Props**: `adminKey`, `collection`, `existingHashes: Set<string>`, `photographers`, `onUploaded`
  - **Input**: drag-and-drop zone and file input (`accept="image/jpeg,image/png"`, multiple); a required photographer select defaulting to `collection.defaultPhotographerId`
  - **Per-file state machine**: queued → processing → uploading → done | failed(reason) | duplicate. Duplicates are detected via `hashFile` against `existingHashes` and within the batch, with an "Upload anyway" action.
  - **Processing**: concurrency 3. For each file: `generateWatermarked`, then `crypto.randomUUID()` id, presign (batch requests in groups of ≤50), then PUT the original, preview and thumbnail with `fetch` (`Content-Type` set), then `createStorePhotos` with `sortOrder` = existing max + index
  - **Failures**: show the reason and a **Retry** button that reprocesses only that file
  - **Progress**: overall "N / total"

  Tests cover the state transitions with mocked APIs, duplicate flagging, and retry.
- [ ] T024 [US1] Create `frontend/components/admin/store/CollectionDetail.tsx` with `CollectionDetail.test.tsx`:
  - **Settings form**: default price (dollars input converted to cents), default photographer, title
  - **Publish toggle**: shows the `problems[]` list from a 422
  - **Photo grid**: thumbnails, status and price-override badges, multi-select
  - **Bulk actions**: set price override, clear override, set photographer, hide, unhide, set cover (single), delete with confirmation
  - **Ordering**: move up/down arrows persist `sortOrder` via `updateStorePhotos`
  - **Replace file** on one photo uses `generateWatermarked`, `presignReplace`, the three PUTs, then `completeReplace`
  - **Uploads**: embeds `StoreUploader`
- [ ] T025 [US1] Create `frontend/components/admin/store/CollectionsSection.tsx` with a list of collections (title, date, status badge, photo count), "New collection" (event select from the existing `getAdminEvents` data plus a default price), and selecting a row opens `CollectionDetail`. Add `CollectionsSection.test.tsx`. Wire the Collections, Upload (opens the selected collection's uploader) and Photographers sub-sections in `frontend/components/admin/store/StoreTab.tsx`.

**Checkpoint**: an admin can fully stock and publish a collection; quickstart steps 2–8 pass (except the Connect-readiness check).

---

## Phase 4: User Story 2 - Visitor Browses and Finds Their Photos (Priority: P1)

**Goal**: The Shop page (renamed Merch) shows Merch and Event Photos sections; visitors browse an event's watermarked photos and add them to a cart. The Gallery links into it.

**Independent Test**: quickstart steps 9 and 22. Nav shows "Shop", `/merch` redirects, the Gallery banner and lightbox link work, the grid loads progressively, the detail view works on mobile, and the cart badge counts photos.

### Backend (US2)

- [ ] T026 [P] [US2] Create `lambda/src/handlers/storePublic.ts` with:
  - `listPublicCollections`: query `byEventDate` descending, filter `status === 'published'`. Map to `PublicCollection` with `coverThumbnailUrl` (cover photo, else the first `forSale` photo by `sortOrder`) and unique `photographerNames`, batch-getting photographers.
  - `getPublicCollectionPage(id, cursor)`: 404 unless published. Query `byCollection` with `FilterExpression status = forSale`, `Limit` 60 and `ExclusiveStartKey` decoded from a base64url `cursor`. Return `PublicPhoto` with `priceCents = priceOverrideCents ?? defaultPriceCents` and `photographerName`, plus `nextCursor`. Never include `originalKey`.

  Note that filtered queries can return fewer than 60 items; loop until 60 or the end. Add `storePublic.test.ts`, including an assertion that no response contains `originalKey`.
- [ ] T027 [US2] Register `GET /api/store/collections` and `GET /api/store/collections/{id}` in `lambda/src/handlers/store.ts`; extend `store.test.ts`

### Frontend (US2)

- [ ] T028 [P] [US2] Add `getPublicCollections()` and `getPublicCollectionPage(id, cursor?)` to `frontend/lib/api/store.ts` with tests
- [ ] T029 [P] [US2] Create `frontend/lib/store/cartContext.tsx` with `cartContext.test.tsx`:
  - `StoreCartProvider` and `useStoreCart()` exposing `items: { photoId, collectionId, thumbnailUrl }[]`, `add`, `remove`, `has`, `clear`, `removeMany(ids)` and `count`
  - Persist to `localStorage` key `bob_photo_cart`, with every read and write wrapped in try/catch, so it renders correctly when storage is unavailable
  - De-duplicate by `photoId`
- [ ] T030 [US2] Wrap `<Component />` in `StoreCartProvider` in `frontend/pages/_app.tsx`
- [ ] T031 [US2] Create `frontend/components/store/CollectionCard.tsx` (presentational: cover, title, formatted date, photo count, photographer credit, link to `/shop/photos?event={id}`)
- [ ] T032 [US2] Create `frontend/components/store/EventPhotosSection.tsx` (`id="photos"`), which fetches `getPublicCollections` with loading, error and empty states ("No event photos are on sale right now.") and renders a `CollectionCard` grid with the caption "Download full-resolution photos. Checkout right here." Below the grid, a "Lost your download link?" link to `/shop/download`. Add `EventPhotosSection.test.tsx`.
- [ ] T033 [US2] Create `frontend/components/store/ShopPage.tsx`: hero "Shop" (same styling as the current `frontend/pages/merch.tsx` hero), a **Merch** section rendering the existing `MerchGrid` and `MerchInfo` under the caption "Checkout on our merch store" (FR-008c), then `EventPhotosSection`. On mount, if `location.hash === '#photos'`, scroll to that section. Add `ShopPage.test.tsx` (both sections render; hash scroll is called). `frontend/pages/shop/index.tsx` is a thin wrapper: `SEO` (title "Shop") + `Header` + `<ShopPage />` + `Footer`.
- [ ] T034 [US2] Replace `frontend/pages/merch.tsx` with a client-side redirect: `useEffect(() => router.replace('/shop'))`, a `<meta httpEquiv="refresh" content="0; url=/shop">` via `next/head`, and the visible text "Merch has moved to Shop" with a link. Update `frontend/components/merch/MerchPage.test.tsx` to test `pages/shop/index.tsx` and add a redirect test.
- [ ] T035 [US2] In `frontend/components/layout/Header.tsx` rename both desktop and mobile "Merch" links to "Shop" with `href="/shop"`. Add a cart icon link to `/shop/cart` with a `count` badge, rendered only when `useStoreCart().count > 0`, on desktop and mobile. Update `frontend/components/layout/Header.test.tsx`.
- [ ] T036 [P] [US2] Create `frontend/components/store/PhotoGrid.tsx` with `PhotoGrid.test.tsx`:
  - **Props**: `photos`, `onSelect(index)`, `hasMore`, `loadMore`, `loading`
  - Responsive thumbnail grid (2 columns at 320px, up to 5 on desktop), `loading="lazy"` images, and an in-cart check badge from `useStoreCart().has`
  - An `IntersectionObserver` sentinel calls `loadMore` when `hasMore && !loading`
- [ ] T037 [P] [US2] Create `frontend/components/store/PhotoDetailModal.tsx` with `PhotoDetailModal.test.tsx`:
  - Full-screen modal showing `previewUrl`, `formatMoney(priceCents)`, "Photo by {photographerName}" and an Add to cart / Remove from cart toggle
  - Prev/Next buttons plus ←/→ and Escape keys; focus trap; image loading spinner
  - Modeled on `frontend/components/gallery/GalleryLightbox.tsx` interactions
- [ ] T038 [US2] Create `frontend/components/store/EventPhotosPage.tsx` taking `collectionId: string | null`:
  - Loads the first page, then appends pages via `nextCursor`
  - Header with collection title, date, photo count and a back link to `/shop#photos`
  - Renders `PhotoGrid` and `PhotoDetailModal`; when the modal reaches the last loaded photo, Next triggers `loadMore`
  - 404 state: "This photo collection isn't available."

  Add `EventPhotosPage.test.tsx` (initial load, load more, modal triggers load more, 404). `frontend/pages/shop/photos.tsx` is a thin wrapper that reads `?event=` via `useRouter` after `router.isReady` and renders `<EventPhotosPage collectionId={…} />`.
- [ ] T039 [US2] Gallery entry points (FR-008b):
  - In `frontend/pages/gallery.tsx` add a banner below the hero: "See yourself? Buy full-resolution, watermark-free photos from our events" with a **Shop event photos** button linking to `/shop#photos`
  - Create `frontend/lib/store/useEventCollectionMap.ts`: a hook returning `Record<eventId, collectionId>` from `getPublicCollections()`, `{}` on failure, with `useEventCollectionMap.test.ts`. `pages/gallery.tsx` calls the hook (it runs in parallel with the existing gallery fetch) and passes the map to `GalleryLightbox`.
  - In `frontend/components/gallery/GalleryLightbox.tsx` show "Buy photos from this event" → `/shop/photos?event={collectionId}` when the current photo's `eventId` is in the map
  - Update `GalleryLightbox.test.tsx` for link shown and hidden
- [ ] T040 [P] [US2] In `frontend/public/sitemap.xml` replace the `/merch` entry with `/shop`

- [ ] T041 [US2] Update Playwright regression coverage for the Shop rename. All tests run on every PR environment and on staging before prod (`e2e-regression.yml`); `CORE_PAGES` is also used by the prod smoke test.
  - In `e2e/types/pages.ts` replace `{ route: '/merch', heading: 'Merch' }` with `{ route: '/shop', heading: 'Shop' }` (otherwise the existing regression and prod smoke checks fail), and add `{ route: '/shop/cart', heading: 'Your Cart' }` and `{ route: '/shop/download', heading: 'Get a new download link' }` (pages that render without query parameters, per constitution Principle X)
  - Add tests for pages that need query parameters: `/shop/photos` (no `event`) and `/shop/photos?event=missing` show "This photo collection isn't available."; `/shop/order` (no params) shows an error state rather than a blank page; `/shop/photographer-setup?token=bogus` shows the invalid/expired link message
  - In `e2e/regression.spec.ts` add a `shop page` describe:
    - `/merch` ends on `/shop` (`toHaveURL(/\/shop/)`)
    - The nav shows a "Shop" link (open the hamburger on mobile, using the existing `openNavIfMobile` pattern) that routes to `/shop`, and no "Merch" link
    - The Merch section heading is visible
    - The Event Photos section shows either at least one collection card or "No event photos are on sale right now." (PR environments start empty)
    - The Gallery "Shop event photos" button lands on `/shop#photos`

**Checkpoint**: US1 + US2 give a browsable store with a working cart badge (checkout not yet available).

---

## Phase 5: User Story 3 - Visitor Purchases and Receives Photos (Priority: P1)

**Goal**: Server-priced cart with volume discounts, Stripe Checkout, idempotent fulfillment (webhook plus reconcile), confirmation page, 7-day tokenized downloads, re-send and emails.

**Independent Test**: quickstart steps 10–13 and 19. The discount applies at 3 photos, a declined card leaves the order pending, a paid order delivers unwatermarked originals on the page and by email, closing the tab still fulfills, and re-send rotates the link.

### Backend (US3)

- [ ] T042 [P] [US3] Create `lambda/src/lib/storePricing.ts` (pure, no AWS imports) with `lambda/src/lib/storePricing.test.ts`:
  - `pickTier(count, tiers)`: highest tier with `minQty ≤ count`, or `null`
  - `nextTier(count, tiers)`: `{ photosNeeded, pctOff }` or `null`
  - `priceCart(lines: { photoId; listPriceCents; photographerId; commissionPct }[], tiers)` returns `{ subtotalCents, discountPct, discountCents, totalCents, lines: OrderLine-like[] }` with `discountCents = Math.round(subtotal * pct / 100)`, allocated with the **largest-remainder method** so Σ line `discountCents` === `discountCents`. Each line gets `amountPaidCents` and `commissionCents = Math.round(amountPaidCents * commissionPct / 100)`.
  - `validateTiers(tiers)`: `minQty` ≥ 2 and strictly increasing, `pctOff` 1–90 and strictly increasing
  - `DEFAULT_TIERS = [{minQty:3,pctOff:15},{minQty:5,pctOff:25},{minQty:10,pctOff:35}]`

  Tests: no tier, each tier boundary, uneven allocation sums exactly (e.g. 3 × $15 at 15% and mixed prices), commission rounding, and invalid tier sets.
- [ ] T043 [P] [US3] Add settings to `lambda/src/handlers/adminStoreCatalog.ts`:
  - `getSettings`: Get `id: 'SETTINGS'` from `STORE_COLLECTIONS_TABLE`, falling back to `DEFAULT_TIERS`
  - `putSettings`: `validateTiers` then Put
  - A shared `loadDiscountTiers()` export for public use

  Register `GET|PUT /api/admin/store/settings` in `store.ts`; extend tests.
- [ ] T044 [US3] In `lambda/src/handlers/storePublic.ts` add `quoteCart`:
  - Validate 1–200 unique ids
  - BatchGet photos and their collections and photographers
  - Mark unavailable any photo that isn't `forSale` or isn't in a `published` collection
  - Run `priceCart` on the available ones with `loadDiscountTiers()`
  - Return the `CartQuote` from contracts/store-api.md, including `lines` with `thumbnailUrl` and `collectionTitle`, `unavailablePhotoIds` and `nextTier`

  Extract the shared loader as `loadPurchasableLines(photoIds)` so checkout reuses it. Tests.
- [ ] T045 [US3] Create `lambda/src/handlers/storeCheckout.ts` with `createCheckout`:
  - **Validation**: `email` (`isValidEmail`), `acceptedLicense === true`, `isAllowedSiteUrl(siteUrl)`, then `verifyTurnstileToken(turnstileToken, sourceIp)` (from `lib/turnstile.ts`) → 400 on failure. Verification runs before any DynamoDB or Stripe write.
  - **Stripe check**: `getStripe()` null → 503 "Store checkout is not available yet"
  - **Availability**: `loadPurchasableLines` → 409 `{ error, unavailablePhotoIds }` if any are unavailable
  - **Pricing**: `priceCart`
  - **Order record**: Put the order with `status: 'pending'` (no `entity`), lowercased `buyerEmail`, `lines`, totals, `siteUrl`, `transfers: []`, `transferProblems: false`, `createdAt`, and `expiresAt = now + 48h` (epoch seconds)
  - **Discount coupon**: if `discountCents > 0`, create a Stripe coupon `{ amount_off: discountCents, currency: 'usd', duration: 'once', max_redemptions: 1, name: `${discountPct}% volume discount` }`
  - **Checkout Session**: `mode: 'payment'`, `payment_method_types: ['card']`, `customer_email`, `client_reference_id: orderId`, `payment_intent_data: { transfer_group: orderId }`, one line item per photo (`price_data` usd, `unit_amount: listPriceCents`, product name `${collectionTitle} — Photo ${n}`, images `[thumbnailUrl]`), `discounts: [{ coupon }]` when present, `success_url: ${siteUrl}/shop/order?id=${orderId}&session_id={CHECKOUT_SESSION_ID}`, `cancel_url: ${siteUrl}/shop/cart`; idempotency key `checkout:${orderId}`
  - **Finish**: save `stripeSessionId` and return `{ checkoutUrl: session.url }`

  Add `storeCheckout.test.ts`.
- [ ] T046 [US3] In `lambda/src/handlers/storeCheckout.ts` add `fulfillOrder(orderId, session)`. Retrieve the PaymentIntent with `expand: ['latest_charge']`, then do a conditional `UpdateCommand`:
  - Condition: `status = :pending`
  - Set `status = paid`, `entity = ORDER`, `paidAt`, `stripePaymentIntentId`, `stripeChargeId`, `downloadTokenHashes = [hash]`, `downloadExpiresAt = +7d`
  - `REMOVE expiresAt`

  The token comes from `generateToken(orderId)`. On `ConditionalCheckFailedException`, return `{ fulfilled: false }` (already done). On success: send the buyer email and the organizer email (each in its own try/catch with `console.error`, so an email failure never un-fulfills), and return `{ fulfilled: true, token }`. Tests cover first and second invocation and email failure tolerance.
- [ ] T047 [US3] Create `lambda/src/lib/storeEmails.ts` (pure text builders) with `storeEmails.test.ts`:
  - `buyerReceiptEmail(order, token)`: photo list with list prices, a discount line, the total, the download link `${siteUrl}/shop/download?token=${token}`, the expiry date, personal-use license text, and re-send instructions
  - `organizerOrderEmail(order)`: buyer, count, total, and `${siteUrl}/admin`
  - `resendEmail(order, token)`
- [ ] T048 [US3] In `lambda/src/handlers/storeCheckout.ts` add `stripeWebhook`:
  - Body = `event.isBase64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body`
  - Verify with `stripe.webhooks.constructEvent(body, headers['stripe-signature'], webhookSecret)`; invalid → 400
  - On `checkout.session.completed` with `payment_status === 'paid'`, call `fulfillOrder(session.client_reference_id, session)`; every other event returns 200
  - Tests: bad signature, ignored type, fulfillment
- [ ] T049 [US3] In `lambda/src/handlers/storePublic.ts` add `getOrderStatus(id, session_id)` per contracts/store-api.md:
  - 404 unless `session_id` matches
  - If `pending`, retrieve the session from Stripe; when `payment_status === 'paid'`, call `fulfillOrder`
  - Return `downloadToken` only if `paidAt` is within 15 minutes. If this call didn't create the token (the webhook fulfilled first), generate a new token and append its hash with `list_append`, trimming to the newest 5; never replace existing hashes.

  Tests, including one asserting the emailed token still validates after the confirmation page loads.
- [ ] T050 [US3] In `lambda/src/handlers/storePublic.ts` add `getDownloads(token)`:
  - `hashTokenSecret` → Get order; 404 unless `status === 'paid'` and the hash is in `downloadTokenHashes`; 410 if past `downloadExpiresAt`
  - Return items with `GetObject` pre-signed URLs from `ORIGINALS_BUCKET` (900s, `ResponseContentDisposition: attachment; filename="${originalFilename}"`), loading `originalKey`/`originalFilename` by BatchGet on photos

  Tests, including refunded → 404 and expired → 410.
- [ ] T051 [US3] In `lambda/src/handlers/storePublic.ts` add `resendDownloads`:
  - `verifyTurnstileToken` (from `lib/turnstile.ts`) failure → 400
  - Query `byEmail` for the lowercased email; for each `paid` order, replace `downloadTokenHashes` with `[newHash]`, set expiry +7d and send `resendEmail`
  - Always return `{ ok: true }`

  Tests.
- [ ] T052 [US3] Register in `lambda/src/handlers/store.ts`:
  - `POST /api/store/cart/quote`
  - `POST /api/store/checkout`
  - `GET /api/store/orders/{id}`
  - `GET /api/store/downloads/{token}`
  - `POST /api/store/orders/resend`
  - `POST /api/store/stripe-webhook`

  Extend `store.test.ts`.

### Frontend (US3)

- [ ] T053 [P] [US3] Add `quoteCart`, `createCheckout`, `getOrderStatus`, `getDownloads` and `resendDownloads` to `frontend/lib/api/store.ts`, with tests. `createCheckout` surfaces 409 `unavailablePhotoIds` as a typed error.
- [ ] T054 [P] [US3] Add `getStoreSettings` and `putStoreSettings` to `frontend/lib/api/adminStore.ts`, and create `frontend/components/admin/store/StoreSettingsSection.tsx` (an editable discount-tier list with add/remove rows and inline validation that mirrors `validateTiers`) with `StoreSettingsSection.test.tsx`. Wire it into `StoreTab`.
- [ ] T055 [US3] Create `frontend/components/store/CartSummary.tsx` with `CartSummary.test.tsx`:
  - Calls `quoteCart` whenever cart ids change (debounced 300ms), with a loading skeleton
  - Lines with thumbnail, collection title, price and Remove; a separate "Volume discount (X%)" line; the total; the nudge "Add N more photo(s) to get X% off"
  - Auto-removes `unavailablePhotoIds` from the cart and shows "Some photos are no longer available and were removed"
  - Empty state links to `/shop#photos`
- [ ] T056 [US3] Create `frontend/pages/shop/cart.tsx` (page heading "Your Cart") with `CartSummary`, an email input, a license checkbox ("I agree to the personal-use Photo License" linking to `/terms-conditions#photo-license`) and a **Checkout** button. The form includes `TurnstileWidget` (from `components/shared/TurnstileWidget.tsx`). The button is disabled until the email is valid, the box is checked and Turnstile has returned a token (reset after any failed attempt), and shows a loading state. It calls `createCheckout({ photoIds, email, siteUrl: window.location.origin, acceptedLicense: true, turnstileToken })` and then `window.location.assign(checkoutUrl)`. On 409: `removeMany`, then show a notice. On 503 or other errors: show a readable message. Add `frontend/components/store/CheckoutForm.tsx` for the form logic with `CheckoutForm.test.tsx`.
- [ ] T057 [US3] Create `frontend/pages/shop/order.tsx`, which polls `getOrderStatus(id, session_id)` every 2s up to 30s:
  - **Paid**: clear the cart; show "Thank you", the total, a **Download your photos** button → `/shop/download?token=` and "We also emailed your links to {email}"
  - **Still pending**: "We're confirming your payment — you'll get an email shortly."

  Put the logic in `frontend/components/store/OrderConfirmation.tsx` with `OrderConfirmation.test.tsx`.
- [ ] T058 [US3] Create `frontend/pages/shop/download.tsx` using `frontend/components/store/DownloadList.tsx`: thumbnail, filename and a Download button (anchor to `downloadUrl`), the expiry date, and a **Download all** that clicks each link sequentially. With no `token` param, render only `ResendForm` with the heading "Get a new download link." On 410 or 404, show the explanation plus `frontend/components/store/ResendForm.tsx` (email + `TurnstileWidget` from `components/shared/TurnstileWidget.tsx`, success message "If we found orders for that email, we've sent new links."). Add `DownloadList.test.tsx` and `ResendForm.test.tsx`.
- [ ] T059 [P] [US3] Add a "Photo License" section with `id="photo-license"` to `frontend/pages/terms-conditions.tsx`, covering personal-use rights: no resale, commercial use or editing away watermarks/credits; commercial licensing via the contact page

- [ ] T060 [US3] In `e2e/regression.spec.ts` add a `photo cart and downloads` describe, data-independent so it passes on empty PR environments and on staging:
  - `/shop/cart` with an empty cart shows the empty state with a link to `/shop#photos` and no enabled Checkout button
  - `/shop/download` with no token shows the "Get a new download link" form with email field and submit button present and enabled
  - `/shop/download?token=bogus.bogus` shows the invalid-link explanation plus the re-send form
- [ ] T061 [US3] Create `e2e/seed/seedStore.ts`, a Node script run with `npx tsx` and idempotent, that prepares a purchasable collection in a **PR environment only**. It refuses to run unless `TABLE_PREFIX` matches `^pr-\d+-$`. Inputs come from env: `BASE_URL`, `ADMIN_KEY`, `STRIPE_TEST_SECRET_KEY`, `TABLE_PREFIX`. Steps:
  - Create a test-mode **Custom** connected account with Stripe test onboarding data (`tos_acceptance`, `external_account: 'btok_us_verified'`, `business_type: 'individual'`, test SSN and DOB values from Stripe's testing docs) so `transfers` is active immediately. Express accounts can't be completed without the hosted flow, which is why this uses Custom.
  - Create the photographer via `POST /api/admin/store/photographers`, then set `stripeAccountId` and `payoutsReady: true` directly with `@aws-sdk/lib-dynamodb` on `connect-${TABLE_PREFIX}store-photographers` (fixture-only shortcut, documented in the script header)
  - Create an event via the admin events API, then a collection at `defaultPriceCents: 1500`
  - Upload 3 small fixture JPEGs from `e2e/fixtures/` (original plus the same file as preview and thumbnail) through the presign → PUT → create flow
  - Publish, and print the collection id

  Add `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-dynamodb`, `stripe` and `tsx` to `e2e/package.json` devDependencies.
- [ ] T062 [US3] Create `e2e/purchase.spec.ts` (full purchase, run only by T063, Desktop Chrome only). Read the collection id from `E2E_COLLECTION_ID`, then:
  - Open `/shop/photos?event=…`, add all 3 photos from the detail modal, and check the header cart badge shows 3
  - On `/shop/cart`, assert the "Volume discount (15%)" line and total `$38.25`
  - Enter `e2e+${Date.now()}@example.com`, tick the license box, and wait for the always-pass Turnstile token
  - Click Checkout; on Stripe's hosted page fill card `4242 4242 4242 4242`, any future expiry, CVC `123`, ZIP `30303`, then pay
  - On `/shop/order`, wait (≤30s) for "Thank you", click **Download your photos**, and on `/shop/download` assert 3 items
  - `request.get()` the first download URL and assert status 200 and `content-type: image/jpeg`

  Set `test.setTimeout(120_000)`.
- [ ] T063 [US3] Create `.github/workflows/e2e-purchase.yml` (`workflow_call` with inputs `base_url` and `pr_number`, `permissions: id-token: write`). It configures AWS credentials with `secrets.AWS_DEPLOY_ROLE_ARN` (same as `pr.yml`), reads `ADMIN_KEY` from the `AdminKeySecretArn` output of `ConnectPR${pr_number}BackendStack` and `STRIPE_TEST_SECRET_KEY` from `connect-dev-stripe`.`secretKey`, masks both with `::add-mask::`, runs `npx tsx seed/seedStore.ts` (exporting `E2E_COLLECTION_ID`), installs Chromium only, then runs `playwright test purchase.spec.ts --project=chromium` in `e2e/`. Call it from `.github/workflows/pr.yml` as a new `purchase-tests` job with `needs: deploy-pr-env` (parallel to `automation-tests`). Never call it from `production.yml`, since staging and prod enforce real Turnstile and prod uses live Stripe keys.

**Checkpoint**: the full purchase loop works in dev with Stripe test keys. This plus US1 and US2 is the **MVP**.

---

## Phase 6: User Story 4 - Admin Views Orders and Sales (Priority: P2)

**Goal**: Orders list with filters, revenue total, CSV export, re-send links and full refund.

**Independent Test**: quickstart step 20, plus re-send and refund (with no photographer transfers yet).

- [ ] T064 [P] [US4] Create `lambda/src/handlers/adminStoreOrders.ts`:
  - `listOrders(from?, to?, collectionId?)`: query `byCreatedAt` with an optional `BETWEEN`, newest first, paginating fully; filter by any line's `collectionId`; strip `downloadTokenHashes`; return `totalRevenueCents` = Σ `totalCents` of paid orders
  - `resendOrder(id)`: paid only; replace `downloadTokenHashes` with `[newHash]`, +7d, `resendEmail`
  - `refundOrder(id)`: paid only, else 409. `stripe.refunds.create({ charge: stripeChargeId }, { idempotencyKey: 'refund:'+id })`, then conditional update `status = paid → refunded`, `refundedAt`, `SET downloadTokenHashes = :empty`.

  Add `adminStoreOrders.test.ts`.
- [ ] T065 [US4] Register `GET /api/admin/store/orders`, `POST /api/admin/store/orders/{id}/resend` and `POST /api/admin/store/orders/{id}/refund` in `lambda/src/handlers/store.ts`; extend tests
- [ ] T066 [P] [US4] Add `getAdminOrders`, `resendOrder` and `refundOrder` to `frontend/lib/api/adminStore.ts` with tests
- [ ] T067 [US4] Create `frontend/components/admin/store/OrdersSection.tsx` with `OrdersSection.test.tsx`:
  - **Filters**: date range (reuse `DATE_FILTER_OPTIONS`) and event (collection select); total revenue
  - **Table**: date via `fmt`, email, photo count, total, status badge; expandable row with line thumbnails and prices
  - **Re-send links**: with a toast
  - **Refund**: confirmation dialog "Refund {total} to {email}? Their download link will stop working."
  - **CSV export**: via `downloadCsv` from `components/admin/submissions/shared.ts` with orderId, date, email, photos, subtotal, discount, total, status

  Wire it into `StoreTab`.

**Checkpoint**: an admin can support buyers end to end.

---

## Phase 7: User Story 5 - Photographers Are Paid Automatically (Priority: P2)

**Goal**: Stripe Connect Express onboarding, publish gate, an automatic transfer per photographer per order, reversals on refund with owed-balance recovery, failure retry and earnings reporting.

**Independent Test**: quickstart steps 1, 1b, 7 and 14–17b.

### Backend (US5)

- [ ] T068 [P] [US5] Create `lambda/src/lib/storeTransfers.ts` with `storeTransfers.test.ts`:
  - `computeTransfers(lines, owedByPhotographer)` (pure): group lines by `photographerId`, sum `commissionCents`, deduct `min(owed, commission)` as `owedDeductedCents`, and set status `'skipped'` when the amount is 0
  - `createTransfers(stripe, order, photographers)`: for each non-skipped transfer, `stripe.transfers.create({ amount, currency: 'usd', destination: stripeAccountId, source_transaction: stripeChargeId, transfer_group: orderId }, { idempotencyKey: `${orderId}:${photographerId}` })`. Record `sent` with `stripeTransferId`, or `failed` with `error.message`. Return the transfers and the per-photographer `owedCents` decrements.
  - `reverseTransfers(stripe, order)`: for each `sent`, `stripe.transfers.createReversal(id, { amount }, { idempotencyKey: 'reverse:'+id })`. On an insufficient-balance error, record `reversal_failed`, `reversedCents: 0` and the shortfall to add to that photographer's `owedCents`.

  Tests: multi-photographer split, owed deduction, skipped, failure, and reversal shortfall.
- [ ] T069 [US5] In `fulfillOrder` in `lambda/src/handlers/storeCheckout.ts`, after the conditional update and before the emails, add:
  - Load the order's photographers and run `createTransfers`
  - Persist `transfers` and `transferProblems` on the order
  - Apply `owedCents` decrements with `UpdateCommand ADD owedCents :neg` (condition `owedCents >= :amt`)
  - If any transfer failed, append a "Photographer payment problem" section to the organizer email

  Extend `storeCheckout.test.ts`.
- [ ] T070 [US5] In `lambda/src/handlers/adminStorePhotographers.ts` add:
  - `sendSetupLink(id)`: if no `stripeAccountId`, `stripe.accounts.create({ type: 'express', country: 'US', email, capabilities: { transfers: { requested: true } }, settings: { payouts: { schedule: { interval: 'weekly', weekly_anchor: 'monday' } } }, metadata: { photographerId: id } }, { idempotencyKey: 'acct:'+id })`. Then `generateToken(id)`, store `setupTokenHash` and `setupTokenExpiresAt` (+30d), and email the photographer (commission explanation and link `${siteUrl}/shop/photographer-setup?token=`). Accept `siteUrl` in the body, validated with `isAllowedSiteUrl`.
  - `dashboardLink(id)`: `stripe.accounts.createLoginLink(stripeAccountId)` returns `{ url }`
  - `syncReadiness(photographer)`: `accounts.retrieve`, `payoutsReady = capabilities.transfers === 'active' && payouts_enabled`, persisted when changed
  - `listPhotographers`: call `syncReadiness` (in parallel) for photographers with a `stripeAccountId` and `!payoutsReady`

  Tests.
- [ ] T071 [US5] In `lambda/src/handlers/storePublic.ts` add `photographerSetup({ token, siteUrl })`: validate the token hash and expiry (404/410), then `stripe.accountLinks.create({ account, type: 'account_onboarding', refresh_url: `${siteUrl}/shop/photographer-setup?token=${token}`, return_url: `${siteUrl}/shop/photographer-setup?token=${token}&done=1` })` returns `{ url }`. Also add `photographerSetupComplete({ token })`, which runs `syncReadiness` and returns `{ ready }`. Tests.
- [ ] T072 [US5] Add a photographer-readiness check to the publish preconditions in `updateCollection` in `lambda/src/handlers/adminStoreCatalog.ts`: for each distinct `photographerId` among `forSale` photos, run `syncReadiness`, and add the problem "{name} hasn't finished payment setup" when not ready (FR-029a). Extend tests.
- [ ] T073 [US5] In `lambda/src/handlers/adminStorePhotographers.ts` add `getEarnings(from, to)` per data-model.md "Derived: Photographer earnings". Query `byCreatedAt` with `createdAt ≤ to` and aggregate in memory, with the aggregation done by a pure `aggregateEarnings(orders, photographers, from, to)` in `lambda/src/lib/storePricing.ts`. Return `photographers[]` and `sales[]` per the contract. Tests, including the to-the-cent match with order totals (SC-007).
- [ ] T074 [US5] In `lambda/src/handlers/adminStoreOrders.ts` add `retryTransfers(id)`: re-run `createTransfers` for `failed` entries only (same idempotency keys), then update `transfers`, `transferProblems` and `owedCents`. Tests.
- [ ] T075 [US5] In `refundOrder` in `lambda/src/handlers/adminStoreOrders.ts`, after the Stripe refund and before the status update, add: `reverseTransfers`, persist the transfer statuses and `reversedCents`, and `ADD owedCents :shortfall` per photographer for `reversal_failed` (FR-030). Extend tests.
- [ ] T076 [US5] Register in `lambda/src/handlers/store.ts`:
  - `POST /api/admin/store/photographers/{id}/setup-link`
  - `POST /api/admin/store/photographers/{id}/dashboard-link`
  - `GET /api/admin/store/earnings`
  - `POST /api/admin/store/orders/{id}/retry-transfers`
  - `POST /api/store/photographer-setup`
  - `POST /api/store/photographer-setup/complete`

  Extend tests.

### Frontend (US5)

- [ ] T077 [P] [US5] Add `sendSetupLink`, `getDashboardLink`, `getEarnings` and `retryTransfers` to `frontend/lib/api/adminStore.ts`, and `startPhotographerSetup` and `completePhotographerSetup` to `frontend/lib/api/store.ts`, with tests
- [ ] T078 [US5] Photographer payments UI:
  - In `frontend/components/admin/store/PhotographersSection.tsx` add a payment status badge (Setup not started / Setup pending / Ready to be paid), **Send setup link** (sends `siteUrl: window.location.origin`; toast "Setup link sent to {email}"), **Open their Stripe dashboard** (opens the returned URL in a new tab) and an owed-amount column
  - Create `frontend/components/admin/store/EarningsPanel.tsx` with a date range, a per-photographer table (photos sold, gross, earnings, sent, not sent, taken back, owed) and CSV exports (summary, and per-sale from `sales[]`) via `downloadCsv`, with `EarningsPanel.test.tsx`
  - Update `PhotographersSection.test.tsx`
- [ ] T079 [US5] In `frontend/components/admin/store/OrdersSection.tsx` add the photographer-payment badge (All paid / Problem, from `transferProblems`), per-transfer status in the expanded row, and a **Retry photographer payments** action shown only when `transferProblems`. Update the refund confirmation copy to "…and take back photographer shares". Update tests.
- [ ] T080 [US5] Create `frontend/pages/shop/photographer-setup.tsx` using `frontend/components/store/PhotographerSetup.tsx`:
  - Without `done`: intro and a **Continue** button → `startPhotographerSetup`, then `window.location.assign(url)`
  - With `done=1`: `completePhotographerSetup` shows "You're all set" or "Stripe needs a bit more information" with Continue
  - 410: "This link has expired — ask the organizer for a new one."
  - `<meta name="robots" content="noindex">`

  Add `PhotographerSetup.test.tsx`.

- [ ] T081 [US5] Extend `e2e/purchase.spec.ts`: after the order is paid, use the Stripe test SDK (`STRIPE_TEST_SECRET_KEY`) to list transfers with `transfer_group` = the order id (parsed from the `/shop/order?id=` URL), and assert exactly one transfer to the seeded account for `Math.round(3825 * commissionPct / 100)` cents. Use a seeded `commissionPct` of 40%, so the expected value is 1530.

**Checkpoint**: photographer shares move automatically; the refund and failure paths are covered.

---

## Phase 8: User Story 6 - Admin Removes a Photo on Request (Priority: P2)

**Goal**: A fast takedown path; removed photos disappear from the store and can't be bought; sold photos can't be hard-deleted.

**Independent Test**: quickstart step 18, plus a removed photo vanishing from `/shop/photos` and the request-removal link working.

- [ ] T082 [US6] In `lambda/src/handlers/adminStoreCatalog.ts` `deleteStorePhotos`, before deleting, check whether the photo appears on any paid or refunded order (query `byCreatedAt` and scan lines; volume is small) and return it in `skipped: [{ id, reason: 'sold' }]` instead of deleting (data-model.md rule). Extend tests.
- [ ] T083 [US6] In `frontend/components/admin/store/CollectionDetail.tsx` add a **Remove from sale** bulk action (status `removed`, with a confirmation explaining that past buyers keep access) and a "Removed" filter view with **Restore**. When delete returns `skipped`, show "N photos were sold and were removed from sale instead" and set them to `removed`. Update `CollectionDetail.test.tsx`.
- [ ] T084 [P] [US6] Support `?subject=` prefill in `frontend/components/contact/ContactForm.tsx` (read from `useRouter().query.subject` when ready) with a test in `ContactForm.test.tsx`. Add a "Request photo removal" link → `/contact?subject=Photo%20removal` to `frontend/components/store/PhotoDetailModal.tsx` and to the Photo License section in `frontend/pages/terms-conditions.tsx` (FR-024).
- [ ] T085 [US6] Verify (test-only) that removal propagates: in `storePublic.test.ts` assert that a `removed` photo is excluded from `getPublicCollectionPage` and reported in `quoteCart.unavailablePhotoIds`, and in `storeCheckout.test.ts` that `createCheckout` returns 409 for it (US6 scenario 2)

**Checkpoint**: all six user stories are functional.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T086 [P] Update `docs/frontend/ADMIN-PAGE.md` with the Store tab architecture (sub-sections, upload pipeline, photographer setup)
- [ ] T087 [P] Create `docs/frontend/SHOP-PAGES.md` documenting the `/shop` routes, cart context and gallery entry points, and add the Stripe setup and secret-writing runbook (from quickstart.md §1) to `docs/`
- [ ] T088 Review every new page for loading, error and empty states at 320px width and fix any gaps (Principle XI); confirm the shop pages use `SEO` with sensible titles and descriptions and that `/shop/order`, `/shop/download` and `/shop/photographer-setup` are `noindex`
- [ ] T089 Security pass over StoreLambda responses: grep the handler outputs and tests to confirm `originalKey`, `downloadTokenHashes`, `setupTokenHash` and Stripe secret values never appear in any API response; confirm `StoreOriginalsBucket` has no public policy in `cdk synth` output
- [ ] T090 Run the pre-PR gate (Principle XIII): in `frontend/` run `npm test -- --ci && npm run lint && npm run typecheck`; in `lambda/` run `npm test && npm run lint`; in `infrastructure/` run `npx cdk synth`. Fix all failures.
- [ ] T091 Deploy to dev (`npx cdk diff` then `deploy` for `ConnectDevDynamoStack` and `ConnectDevBackendStack`), write test Stripe keys to `connect-dev-stripe`, and run the full quickstart.md walkthrough (steps 1–22), recording results in the PR description

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: depends on Setup; **blocks all stories**
- **US1 (Phase 3)**: depends on Foundational
- **US2 (Phase 4)**: depends on Foundational; needs published data from US1 to demo, but its code is independent (it can be tested with seeded DynamoDB items)
- **US3 (Phase 5)**: depends on US2 (cart context, photo pages) and Foundational
- **US4 (Phase 6)**: depends on US3 (orders exist)
- **US5 (Phase 7)**: depends on US1 (photographers, publish gate), US3 (`fulfillOrder`) and US4 (`refundOrder`, OrdersSection)
- **US6 (Phase 8)**: depends on US1 and US3
- **Polish (Phase 9)**: after the desired stories

### Story completion order

```text
Setup → Foundational → US1 ─┬─► US2 ──► US3 ──► US4 ──► US5
                            │                    └────► US6
                            └──────────────────────────► (US6 also needs US1)
```

### Within each story

Tests are written alongside each source file in the same task (colocated); a task isn't done until its test passes. Lambda handlers come before router registration, which comes before frontend API functions, which come before components and pages.

---

## Parallel Opportunities

- **Phase 1**: T002 and T003 in parallel after T001
- **Phase 2**: T009, T010 and T012 in parallel; T004–T008 are sequential (same CDK files)
- **US1**: T014 and T015 (different handler files) and T019 and T020 (frontend libs) can all start together; T021–T025 follow
- **US2**: T026 (Lambda) alongside T028, T029, T036 and T037 (frontend); T040 anytime; T041 (e2e) after T033–T035 and T039
- **US3**: T042, T043, T053 and T059 together; then T044–T052 sequentially (shared handler files); then T054–T058; e2e: T060 and T061 together, then T062, then T063
- **US4**: T064 and T066 together
- **US5**: T068 and T077 together; T069–T076 are sequential (shared handler files); T078–T080 after T077; T081 after T069
- **Polish**: T086 and T087 together

### Example: US1 kickoff

```text
Task: "T014 [P] [US1] adminStorePhotographers.ts (list/create/update) + tests"
Task: "T015 [P] [US1] adminStoreCatalog.ts collection functions + tests"
Task: "T019 [P] [US1] frontend/lib/store/hashFile.ts + test"
Task: "T020 [P] [US1] frontend/lib/store/generateWatermarked.ts + test"
```

---

## Implementation Strategy

### MVP (US1 + US2 + US3)

1. Phases 1–2, then deploy dev infrastructure
2. US1: stock a collection. Validate quickstart steps 2–8.
3. US2: browse via Shop and Gallery. Validate steps 9 and 22.
4. US3: buy and download. Validate steps 10–13 and 19.
5. **Stop and validate**: a working photo store. Until US5 ships, photographers can't be onboarded, so publishing is gated only on assignment. Don't enable live Stripe keys in prod until US5 is complete; otherwise sales would have no automatic photographer payments.

### Incremental delivery

- **US4**: operator tooling (orders, refunds)
- **US5**: automatic photographer payments, **required before the prod launch**
- **US6**: takedown hardening
- **Polish**: then merge, which deploys staging; run quickstart §5 before writing live keys

### Suggested PR slicing

1. Phases 1–2 (infra + skeleton)
2. US1
3. US2 (includes the Merch → Shop rename)
4. US3
5. US4 + US5
6. US6 + Polish

Each PR passes the Principle XIII gate on its own.
