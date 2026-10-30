// Pure helpers for the one-time gallery → photo library migration (research R13).
// Kept free of AWS and sharp so they can be unit-tested. The CLI is migrate-gallery.ts.

import type { LibraryPhoto } from '../../../shared/types/store';

export interface LegacyPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  visible: boolean;
  sortOrder: number;
  eventId?: string | null;
  createdAt: string;
}

export interface MappingRow {
  legacyId: string;
  thumbnailUrl: string;
  visible: string;
  sortOrder: string;
  eventId: string;
  eventTitle: string;
}

export const MAPPING_COLUMNS: (keyof MappingRow)[] = ['legacyId', 'thumbnailUrl', 'visible', 'sortOrder', 'eventId', 'eventTitle'];

// Matches generatePhotoVersions.ts in the frontend.
export const WEB_LONG_EDGE = 2000;
export const PREVIEW_LONG_EDGE = 1600;
export const THUMB_WIDTH = 600;
export const DEFAULT_COLLECTION_PRICE_CENTS = 1500;

// ── CSV ──────────────────────────────────────────────────────────────────────

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: MappingRow[]): string {
  const lines = [MAPPING_COLUMNS.join(',')];
  for (const row of rows) lines.push(MAPPING_COLUMNS.map((c) => csvCell(row[c] ?? '')).join(','));
  return lines.join('\n') + '\n';
}

// Minimal RFC 4180 parser: quoted cells, escaped quotes, commas/newlines inside quotes.
export function parseCsv(text: string): MappingRow[] {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell); cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c !== '')) records.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((c) => c !== '')) records.push(row);

  const [header, ...body] = records;
  if (!header) return [];
  const index = new Map(header.map((h, i) => [h.trim(), i]));
  for (const col of MAPPING_COLUMNS) {
    if (!index.has(col)) throw new Error(`Mapping file is missing the "${col}" column`);
  }
  return body.map((cells) => Object.fromEntries(
    MAPPING_COLUMNS.map((c) => [c, (cells[index.get(c)!] ?? '').trim()]),
  ) as unknown as MappingRow);
}

// Every legacy photo must appear exactly once with a known event (spec: every photo has an event).
export function validateMapping(rows: MappingRow[], legacyIds: string[], knownEventIds: Set<string>): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.legacyId)) problems.push(`Photo ${row.legacyId} appears more than once`);
    seen.add(row.legacyId);
    if (!legacyIds.includes(row.legacyId)) problems.push(`Photo ${row.legacyId} is not in the legacy gallery`);
    if (!row.eventId) problems.push(`Photo ${row.legacyId} has no eventId`);
    else if (!knownEventIds.has(row.eventId)) problems.push(`Photo ${row.legacyId}: event ${row.eventId} does not exist`);
  }
  for (const id of legacyIds) {
    if (!seen.has(id)) problems.push(`Photo ${id} is missing from the mapping file`);
  }
  return problems;
}

// ── Keys and sizes ───────────────────────────────────────────────────────────

export function keyFromUrl(url: string, cloudfrontDomain: string): string {
  const prefix = `https://${cloudfrontDomain}/`;
  if (!url.startsWith(prefix)) throw new Error(`URL ${url} is not on the media domain ${cloudfrontDomain}`);
  return url.slice(prefix.length);
}

export function originalExt(url: string): 'jpg' | 'png' {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
  if (ext === 'png') return 'png';
  throw new Error(`Unsupported image type in ${url} (expected JPEG or PNG)`);
}

export function libraryKeys(id: string, ts: number) {
  return {
    web: `library/web/${id}-${ts}.jpg`,
    webThumb: `library/web-thumbs/${id}-${ts}.jpg`,
    preview: `library/previews/${id}-${ts}.jpg`,
    thumbnail: `library/thumbs/${id}-${ts}.jpg`,
  };
}

export function versionSizes(width: number, height: number) {
  const longEdge = Math.max(width, height);
  const size = (scale: number) => ({ width: Math.round(width * scale), height: Math.round(height * scale) });
  return {
    web: size(Math.min(1, WEB_LONG_EDGE / longEdge)),
    preview: size(Math.min(1, PREVIEW_LONG_EDGE / longEdge)),
    thumb: size(Math.min(1, THUMB_WIDTH / width)),
  };
}

// ── Watermark ────────────────────────────────────────────────────────────────

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Same tiled pattern as the browser (generatePhotoVersions.ts): text rotated -30°,
// white at 30% with a 15% dark stroke, alternate rows offset by half a step.
export function watermarkSvg(width: number, height: number, text = 'BEATS ON THE BLOCK'): string {
  const fontSize = Math.max(14, Math.round(width * 0.06));
  const stepX = Math.max(300, fontSize * 10);
  const stepY = Math.max(150, fontSize * 4);
  const diagonal = Math.ceil(Math.hypot(width, height));
  const strokeWidth = Math.max(1, fontSize / 20);
  const label = escapeXml(text);

  const items: string[] = [];
  for (let y = -diagonal; y <= diagonal; y += stepY) {
    const offset = (Math.abs(Math.round(y / stepY)) % 2) * (stepX / 2);
    for (let x = -diagonal; x <= diagonal; x += stepX) {
      items.push(`<text x="${x + offset}" y="${y}">${label}</text>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
    + `<g transform="translate(${width / 2} ${height / 2}) rotate(-30)" font-family="Anton, Impact, 'Arial Black', sans-serif" `
    + `font-weight="bold" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle" `
    + `fill="rgba(255,255,255,0.30)" stroke="rgba(0,0,0,0.15)" stroke-width="${strokeWidth}">`
    + items.join('')
    + '</g></svg>';
}

// ── Records ──────────────────────────────────────────────────────────────────

export function toLibraryPhoto(args: {
  legacy: LegacyPhoto;
  collectionId: string;
  originalKey: string;
  originalBytes: number;
  width: number;
  height: number;
  contentHash: string;
  urls: { webUrl: string; webThumbUrl: string; previewUrl: string; thumbnailUrl: string };
  now: string;
}): LibraryPhoto & { galleryKey?: 'GALLERY' } {
  const { legacy } = args;
  const photo: LibraryPhoto = {
    id: legacy.id,
    collectionId: args.collectionId,
    sortOrder: legacy.sortOrder,
    originalKey: args.originalKey,
    originalFilename: args.originalKey.split('/').pop()!,
    originalBytes: args.originalBytes,
    width: args.width,
    height: args.height,
    contentHash: args.contentHash,
    ...args.urls,
    photographerId: null,
    priceOverrideCents: null,
    forSale: false,
    inGallery: legacy.visible,
    removed: false,
    gallerySortOrder: legacy.sortOrder,
    createdAt: legacy.createdAt,
    updatedAt: args.now,
  };
  return legacy.visible ? { ...photo, galleryKey: 'GALLERY' } : photo;
}

// The public Gallery used to show visible legacy photos by sortOrder. After migration the
// same photos must appear in the same relative order (new uploads may be interleaved).
export function galleryOrderProblems(legacy: LegacyPhoto[], galleryIds: string[]): string[] {
  const expected = legacy.filter((p) => p.visible).sort((a, b) => a.sortOrder - b.sortOrder).map((p) => p.id);
  const expectedSet = new Set(expected);
  const actual = galleryIds.filter((id) => expectedSet.has(id));
  const problems: string[] = [];
  const missing = expected.filter((id) => !actual.includes(id));
  if (missing.length) problems.push(`${missing.length} visible photo(s) are missing from the new gallery: ${missing.join(', ')}`);
  if (!missing.length && actual.join() !== expected.join()) problems.push('Gallery order differs from the legacy gallery');
  return problems;
}
