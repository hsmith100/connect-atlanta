// Photo library + photo store types — see specs/009-photo-store/data-model.md and contracts/store-api.md.
// The library (collections + photos) is shared by the public Gallery and the store.
// All money values are integer cents (USD). All timestamps are ISO-8601 strings.

// ── Stored entities ───────────────────────────────────────────────────────────

export type CollectionStatus = 'draft' | 'published';

// One per event. `status` controls only the collection's store listing.
export interface PhotoCollection {
  id: string;
  entity: 'COLLECTION';
  eventId: string;
  title: string;
  eventDate: string;
  status: CollectionStatus;
  defaultPriceCents: number;
  defaultPhotographerId: string | null;
  coverPhotoId: string | null;
  // Photos not removed
  photoCount: number;
  // Photos with forSale && !removed
  forSaleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountTier {
  minQty: number;
  pctOff: number;
}

export interface StoreSettings {
  discountTiers: DiscountTier[];
}

export interface LibraryPhoto {
  id: string;
  collectionId: string;
  sortOrder: number;
  originalKey: string;
  originalFilename: string;
  originalBytes: number;
  width: number;
  height: number;
  contentHash: string;
  // Clean (unwatermarked) versions for the Gallery
  webUrl: string;
  webThumbUrl: string;
  // Watermarked versions for the store
  previewUrl: string;
  thumbnailUrl: string;
  // Required before the photo can be put on sale
  photographerId: string | null;
  priceOverrideCents: number | null;
  forSale: boolean;
  inGallery: boolean;
  // Takedown: hidden from both the Gallery and the store; kept for past buyers
  removed: boolean;
  gallerySortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Photographer {
  id: string;
  name: string;
  email: string;
  commissionPct: number;
  active: boolean;
  stripeAccountId: string | null;
  payoutsReady: boolean;
  owedCents: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'paid' | 'refunded';

export interface OrderLine {
  photoId: string;
  collectionId: string;
  thumbnailUrl: string;
  listPriceCents: number;
  discountCents: number;
  amountPaidCents: number;
  photographerId: string;
  commissionPct: number;
  commissionCents: number;
}

export type TransferStatus = 'sent' | 'failed' | 'reversed' | 'reversal_failed' | 'skipped';

export interface PhotographerTransfer {
  photographerId: string;
  commissionCents: number;
  owedDeductedCents: number;
  amountCents: number;
  stripeTransferId: string | null;
  status: TransferStatus;
  error: string | null;
  reversedCents: number;
}

// Order as returned to admins — download token hashes are never included.
export interface StoreOrder {
  id: string;
  entity?: 'ORDER';
  status: OrderStatus;
  buyerEmail: string;
  lines: OrderLine[];
  subtotalCents: number;
  discountPct: number;
  discountCents: number;
  totalCents: number;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  transfers: PhotographerTransfer[];
  transferProblems: boolean;
  siteUrl: string;
  downloadExpiresAt: string | null;
  createdAt: string;
  paidAt: string | null;
  refundedAt: string | null;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface PublicCollection {
  id: string;
  eventId: string;
  title: string;
  eventDate: string;
  coverThumbnailUrl: string | null;
  photoCount: number;
  photographerNames: string[];
}

export interface PublicPhoto {
  id: string;
  thumbnailUrl: string;
  previewUrl: string;
  width: number;
  height: number;
  priceCents: number;
  photographerName: string;
}

export interface PublicCollectionPage {
  collection: Pick<PublicCollection, 'id' | 'title' | 'eventDate' | 'photoCount'>;
  photos: PublicPhoto[];
  nextCursor: string | null;
}

export interface CartQuoteRequest {
  photoIds: string[];
}

export interface CartQuoteLine {
  photoId: string;
  thumbnailUrl: string;
  collectionTitle: string;
  listPriceCents: number;
}

export interface CartQuote {
  lines: CartQuoteLine[];
  unavailablePhotoIds: string[];
  subtotalCents: number;
  discountPct: number;
  discountCents: number;
  totalCents: number;
  nextTier: { photosNeeded: number; pctOff: number } | null;
}

export interface CheckoutRequest {
  photoIds: string[];
  email: string;
  siteUrl: string;
  acceptedLicense: boolean;
  turnstileToken: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface CheckoutUnavailableResponse {
  error: string;
  unavailablePhotoIds: string[];
}

export interface OrderStatusResponse {
  status: OrderStatus;
  email: string;
  totalCents: number;
  discountCents: number;
  lineCount: number;
  downloadToken?: string;
}

export interface DownloadItem {
  photoId: string;
  thumbnailUrl: string;
  filename: string;
  downloadUrl: string;
}

export interface DownloadsResponse {
  orderId: string;
  expiresAt: string;
  items: DownloadItem[];
}

export interface ResendRequest {
  email: string;
  turnstileToken: string;
}

export interface PhotographerSetupRequest {
  token: string;
  siteUrl: string;
}

// ── Admin API ─────────────────────────────────────────────────────────────────

export interface CollectionCreatePayload {
  eventId: string;
  defaultPriceCents: number;
  defaultPhotographerId?: string | null;
}

export interface CollectionUpdatePayload {
  title?: string;
  defaultPriceCents?: number;
  defaultPhotographerId?: string | null;
  coverPhotoId?: string | null;
  status?: CollectionStatus;
}

export interface PublishProblemsResponse {
  error: string;
  problems: string[];
}

export interface LibraryPresignRequest {
  id: string;
  filename: string;
  contentType: string;
  bytes: number;
}

export interface LibraryPresignResponse {
  id: string;
  originalUploadUrl: string;
  webUploadUrl: string;
  webThumbUploadUrl: string;
  previewUploadUrl: string;
  thumbUploadUrl: string;
  webUrl: string;
  webThumbUrl: string;
  previewUrl: string;
  thumbnailUrl: string;
  originalKey: string;
}

export interface LibraryPhotoCreatePayload {
  id: string;
  collectionId: string;
  originalKey: string;
  originalFilename: string;
  originalBytes: number;
  width: number;
  height: number;
  contentHash: string;
  webUrl: string;
  webThumbUrl: string;
  previewUrl: string;
  thumbnailUrl: string;
  photographerId: string | null;
  sortOrder: number;
  forSale: boolean;
  inGallery: boolean;
}

export interface LibraryPhotoUpdatePayload {
  id: string;
  sortOrder?: number;
  gallerySortOrder?: number;
  forSale?: boolean;
  inGallery?: boolean;
  removed?: boolean;
  priceOverrideCents?: number | null;
  photographerId?: string;
}

export interface LibraryPhotoReplaceRequest {
  filename: string;
  contentType: string;
  bytes: number;
}

export interface LibraryPhotoReplaceComplete {
  originalKey: string;
  webUrl: string;
  webThumbUrl: string;
  previewUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  contentHash: string;
  originalFilename: string;
  originalBytes: number;
}

export interface LibraryPhotoDeleteResponse {
  deleted: number;
  skipped: { id: string; reason: 'sold' }[];
}

export interface PhotographerCreatePayload {
  name: string;
  email: string;
  commissionPct: number;
}

export interface PhotographerUpdatePayload {
  name?: string;
  email?: string;
  commissionPct?: number;
  active?: boolean;
}

export interface PhotographerEarnings {
  photographerId: string;
  name: string;
  commissionPct: number;
  payoutsReady: boolean;
  photosSold: number;
  grossSalesCents: number;
  earningsCents: number;
  sentCents: number;
  notSentCents: number;
  takenBackCents: number;
  owedCents: number;
}

export interface EarningsSale {
  orderId: string;
  paidAt: string;
  photoId: string;
  photographerId: string;
  amountPaidCents: number;
  commissionPct: number;
  commissionCents: number;
  transferStatus: TransferStatus | null;
}

export interface EarningsResponse {
  from: string;
  to: string;
  photographers: PhotographerEarnings[];
  sales: EarningsSale[];
}

export interface AdminOrdersResponse {
  orders: StoreOrder[];
  totalRevenueCents: number;
}
