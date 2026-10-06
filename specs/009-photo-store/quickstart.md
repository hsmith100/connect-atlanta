# Quickstart: Event Photo Store

**Feature**: 009-photo-store | **Date**: 2026-10-05

How to set up, run and validate the photo store end to end. Use the dev environment for every step except the final staging check (Principle III).

## 1. One-time setup

### Stripe account
1. Create or sign in to the organization's Stripe account. First check whether one already exists from the Rebelity setup; if so, use it. Complete business verification before prod launch.
2. **Enable Connect**: Dashboard → Connect → Get started → choose "Platform or marketplace", set the platform name and branding shown to photographers during setup. Do this in test mode now and in live mode before prod launch.
3. In **test mode**, copy the secret key (`sk_test_...`).
4. Install the Stripe CLI for local webhook testing: `brew install stripe/stripe-cli/stripe`, then run `stripe login`.

### Deploy infrastructure (dev first)
```bash
cd infrastructure
npx cdk diff ConnectDevDynamoStack ConnectDevBackendStack   # review: 4 new tables, StoreOriginalsBucket, StoreLambda, StripeSecret, routes
npx cdk deploy ConnectDevDynamoStack ConnectDevBackendStack
```

### Write the Stripe secret
Use the `StripeSecretArn` output from the deploy:
```bash
aws secretsmanager put-secret-value --secret-id <StripeSecretArn> \
  --secret-string '{"secretKey":"sk_test_...","webhookSecret":"whsec_..."}'
```
- **dev**: `webhookSecret` comes from `stripe listen` (step 2); PR environments rely on the reconcile path.
- **staging/prod**: in the Stripe dashboard → Developers → Webhooks → add endpoint `<ApiUrl>/api/store/stripe-webhook` (the API Gateway URL output, not the site domain) for the event `checkout.session.completed`. Copy its signing secret. Staging uses test mode; prod uses **live** mode keys.

StoreLambda caches the secret per cold start. Force a refresh after writing it with `aws lambda update-function-configuration --function-name <StoreLambda> --description "secret rotated $(date +%s)"`.

## 2. Run locally
```bash
cd frontend && npm run dev                       # proxies /api/* to the dev API
stripe listen --forward-to <DevApiUrl>/api/store/stripe-webhook   # optional: exercises the webhook path
```

## 3. Validation walkthrough (maps to the spec's acceptance scenarios)

| # | Step | Expected | Spec |
|---|---|---|---|
| 1 | Admin → Store → Photographers: add "Test Shooter" at 40% and "Second Shooter" at 50%; click **Send setup link** for each | Both show "Setup pending"; setup emails arrive | US5-1 |
| 1b | Open each setup link and complete Stripe test onboarding (use test values: SSN `000-00-0000`, routing `110000000`, account `000123456789`) | Return page says "You're all set"; admin shows "Ready to be paid" | US5-2 |
| 2 | Admin → **Photos** → Collections → New from an existing event; default price $15.00 | Draft collection created | US1-3 |
| 2b | In the collection, select 3 photos → Show in gallery; select 2 → Take off sale; then Photos → Gallery order → reorder → Save | Public `/gallery` shows the 3 clean (unwatermarked) web-size photos in that order; the Shop lists only for-sale photos | US1-6, US1-7 |
| 3 | Upload 20 JPEGs (include one >25 MB and one `.txt` renamed to `.jpg`) as Test Shooter | 19 Done, 1 Failed with reason and Retry; progress visible throughout | US1-1, edge cases |
| 4 | Re-upload one of the same files | Flagged Duplicate and skipped | Edge case |
| 5 | Copy any `previewUrl`; open it | Watermarked, ≤1600px | FR-003 |
| 6 | `aws s3 ls s3://<StoreOriginalsBucket>/originals/` shows 19 objects; try `https://<media-domain>/originals/<id>.jpg` and the bucket's public S3 URL | Both return 403 or 404 | US1-2, SC-004 |
| 7 | Add a third photographer without completing setup, assign 1 photo to them, then try to publish | 422 naming that photographer as not ready to be paid (reassign the photo back afterward) | FR-029a, US5-3 |
| 8 | Set a $25 override on one photo; reassign 5 photos to Second Shooter; publish | Published; override shows $25 | US1-3, US1-4 |
| 9 | Visitor: Gallery → "Shop event photos" lands on `/shop#photos`; open a gallery photo from the same event → "Buy photos from this event"; then event → scroll → open detail → ←/→ | Grid loads progressively; first screen < 2s on throttled "Fast 4G" in DevTools | US2, SC-002 |
| 10 | Add 2 photos → cart shows "Add 1 more photo to get 15% off"; add 1 more | Discount line −15% appears; total correct | FR-032–034 |
| 11 | Checkout with card `4000 0000 0000 0002` (decline) | Stripe shows decline; order stays pending; no email sent | US3-4 |
| 12 | Checkout with `4242 4242 4242 4242` | Confirmation page shows paid plus Download button; buyer and organizer emails arrive within 5 minutes; downloads are unwatermarked originals | US3-3, US3-5, FR-022 |
| 13 | Repeat 12 but close the tab on Stripe's success redirect (with `stripe listen` running) | Order still becomes paid and the email arrives | FR-018 |
| 14 | Stripe dashboard (test) → Connect → each account → transfers; Admin → Photographers → Earnings | One transfer per shooter for the step-12 order, each = Σ(amount paid for their photos after discount) × rate; matches the earnings "sent" column to the cent | US5-4, SC-007, SC-008 |
| 15 | Change Test Shooter to 60%; place another order | Earlier order's transfer unchanged at 40%; new transfer at 60% | US5-6 |
| 16 | In Stripe, restrict Second Shooter's test account (or use an account that hasn't finished onboarding), then place an order with their photo | Order still completes and buyer gets downloads; Orders shows a failed-payment badge; organizer email warns; **Retry** succeeds after fixing the account | FR-029b |
| 17 | **Refund** the step-12 order from Admin → Orders | Stripe shows the refund and both transfer reversals; download link returns 404; earnings show "taken back" | FR-021, FR-030 |
| 17b | Simulate a reversal shortfall: manually pay out Test Shooter's test balance in Stripe, then refund another order | Order shows `reversal_failed`; Test Shooter's owed amount increases; their next sale's transfer is reduced by it | FR-030, edge case |
| 18 | Remove a photo that's in another visitor's cart; that visitor checks out | 409 notice; photo removed from cart; not charged | US6-2 |
| 19 | Download page → "Resend" with the buyer email | New email; old link returns 404; new link works | US3-6, R5 |
| 20 | Admin → Orders → filter by date and event → Export CSV; Earnings → Export CSV | CSVs match on-screen rows | US4-3, US5-4 |
| 21 | Resize to 320px wide and repeat steps 9–12 | Fully usable | Principle XI |
| 22 | Nav shows "Shop" (not "Merch") on desktop and mobile; visit `/merch` on both domains | Redirects to `/shop`; merch products still link to Bonfire | FR-008, FR-008a, FR-008c |

## 3b. Gallery migration (US7, per environment: dev → staging → prod)
```bash
cd infrastructure
npx tsx scripts/migrate-gallery.ts --env dev --plan                                 # writes gallery-migration-dev.csv
# fill in eventId for every blank row, then:
npx tsx scripts/migrate-gallery.ts --env dev --run --map gallery-migration-dev.csv
npx tsx scripts/migrate-gallery.ts --env dev --verify
# after checking /gallery looks identical (and PR B is deployed to that env):
npx tsx scripts/migrate-gallery.ts --env dev --cleanup
```
Expected: same Gallery photos and order; old `https://<media>/photos/<id>.jpg` URLs return 403/404; Photos tab shows each migrated photo under its event with "In gallery".

## 4. Pre-PR gate (Principle XIII)
```bash
cd frontend && npm test -- --ci && npm run lint && npm run typecheck
cd ../lambda && npm test
```

## 5. Staging → prod
1. Merge to `main`, which deploys staging. Repeat walkthrough steps 8–14 on staging using Stripe **test** keys.
2. Before announcing in prod: enable Connect in **live** mode, write **live** Stripe keys and the live webhook secret to the prod `StripeSecret`, have each real photographer complete setup, then make one real $0.50 purchase and refund it from the admin.
3. Confirm with the organization's accountant that no sales tax collection is required (research R7).
