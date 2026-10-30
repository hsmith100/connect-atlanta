// One-time migration of the legacy gallery (connect-*photos) into the photo library.
// See specs/009-photo-store/research.md R13 and quickstart.md §3b.
//
//   cd lambda
//   npx tsx src/scripts/migrate-gallery.ts --env dev --plan
//   npx tsx src/scripts/migrate-gallery.ts --env dev --run --map gallery-migration-dev.csv
//   npx tsx src/scripts/migrate-gallery.ts --env dev --verify
//   npx tsx src/scripts/migrate-gallery.ts --env dev --cleanup      (only after checking /gallery)
//
// Uses your local AWS credentials. Run one environment at a time: dev → staging → prod.

import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline/promises';
import sharp from 'sharp';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, ScanCommand, QueryCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { PhotoCollection } from '../../../shared/types/store';
import {
  toCsv, parseCsv, validateMapping, keyFromUrl, originalExt, libraryKeys, versionSizes, watermarkSvg,
  toLibraryPhoto, galleryOrderProblems, DEFAULT_COLLECTION_PRICE_CENTS, type LegacyPhoto, type MappingRow,
} from './migrateGalleryLib';

const region = 'us-east-1';
const cfn = new CloudFormationClient({ region });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } });
const s3 = new S3Client({ region });

const STACKS: Record<string, { dynamo: string; backend: string }> = {
  dev: { dynamo: 'ConnectDevDynamoStack', backend: 'ConnectDevBackendStack' },
  staging: { dynamo: 'ConnectStagingDynamoStack', backend: 'ConnectStagingBackendStack' },
  prod: { dynamo: 'ConnectDynamoStack', backend: 'ConnectBackendStack' },
};

interface Env {
  name: string;
  legacyTable: string;
  eventsTable: string;
  collectionsTable: string;
  libraryTable: string;
  mediaBucket: string;
  originalsBucket: string;
  mediaDomain: string;
  // Media CloudFront domain → bucket for every environment. Legacy records may point at
  // another environment's files (dev's legacy gallery references staging's media).
  bucketByDomain: Map<string, string>;
}

interface EventRecord { id: string; title?: string; date?: string }

function log(message = ''): void {
  process.stdout.write(message + '\n');
}

function fail(message: string): never {
  process.stderr.write(`\n✗ ${message}\n`);
  process.exit(1);
}

async function outputs(stackName: string): Promise<Record<string, string>> {
  const r = await cfn.send(new DescribeStacksCommand({ StackName: stackName }));
  return Object.fromEntries((r.Stacks?.[0]?.Outputs ?? []).map((o) => [o.OutputKey!, o.OutputValue!]));
}

async function resolveEnv(name: string): Promise<Env> {
  const stacks = STACKS[name];
  if (!stacks) fail(`--env must be one of: ${Object.keys(STACKS).join(', ')}`);
  const [d, b, ...allBackends] = await Promise.all([
    outputs(stacks.dynamo), outputs(stacks.backend), ...Object.values(STACKS).map((s) => outputs(s.backend)),
  ]);
  const bucketByDomain = new Map(allBackends
    .filter((o) => o.MediaDistributionDomain && o.MediaBucketName)
    .map((o) => [o.MediaDistributionDomain, o.MediaBucketName] as [string, string]));
  const required: Record<string, string | undefined> = {
    PhotosTableName: d.PhotosTableName, EventsTableName: d.EventsTableName,
    PhotoCollectionsTableName: d.PhotoCollectionsTableName, PhotoLibraryTableName: d.PhotoLibraryTableName,
    MediaBucketName: b.MediaBucketName, StoreOriginalsBucketName: b.StoreOriginalsBucketName,
    MediaDistributionDomain: b.MediaDistributionDomain,
  };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) fail(`Stack outputs missing for ${name}: ${missing.join(', ')}. Is the photo library deployed there?`);
  return {
    name,
    legacyTable: d.PhotosTableName, eventsTable: d.EventsTableName,
    collectionsTable: d.PhotoCollectionsTableName, libraryTable: d.PhotoLibraryTableName,
    mediaBucket: b.MediaBucketName, originalsBucket: b.StoreOriginalsBucketName, mediaDomain: b.MediaDistributionDomain,
    bucketByDomain,
  };
}

// Where a legacy file actually lives: { bucket, key } from its URL's domain.
function legacySource(env: Env, url: string): { bucket: string; key: string } {
  const domain = new URL(url).host;
  const bucket = env.bucketByDomain.get(domain);
  if (!bucket) throw new Error(`URL ${url} is not on any environment's media domain`);
  return { bucket, key: keyFromUrl(url, domain) };
}

async function scanAll<T>(TableName: string): Promise<T[]> {
  const items: T[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const r = await ddb.send(new ScanCommand({ TableName, ExclusiveStartKey: startKey }));
    items.push(...((r.Items ?? []) as T[]));
    startKey = r.LastEvaluatedKey;
  } while (startKey);
  return items;
}

async function legacyPhotos(env: Env): Promise<LegacyPhoto[]> {
  return (await scanAll<LegacyPhoto>(env.legacyTable)).sort((a, b) => a.sortOrder - b.sortOrder);
}

async function libraryHas(env: Env, id: string): Promise<boolean> {
  const r = await ddb.send(new GetCommand({ TableName: env.libraryTable, Key: { id }, ProjectionExpression: 'id' }));
  return !!r.Item;
}

async function getBytes(Bucket: string, Key: string): Promise<Buffer> {
  const r = await s3.send(new GetObjectCommand({ Bucket, Key }));
  return Buffer.from(await r.Body!.transformToByteArray());
}

// ── --plan ───────────────────────────────────────────────────────────────────

async function plan(env: Env): Promise<void> {
  const [photos, events] = await Promise.all([legacyPhotos(env), scanAll<EventRecord>(env.eventsTable)]);
  const titleOf = new Map(events.map((e) => [e.id, e.title ?? '']));
  const rows: MappingRow[] = photos.map((p) => ({
    legacyId: p.id,
    thumbnailUrl: p.thumbnailUrl,
    visible: String(p.visible),
    sortOrder: String(p.sortOrder),
    eventId: p.eventId ?? '',
    eventTitle: p.eventId ? titleOf.get(p.eventId) ?? '' : '',
  }));
  const file = `gallery-migration-${env.name}.csv`;
  writeFileSync(file, toCsv(rows));

  const eventsFile = `gallery-migration-${env.name}-events.csv`;
  const sorted = [...events].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  writeFileSync(eventsFile, ['eventId,date,title', ...sorted.map((e) => `${e.id},${e.date ?? ''},"${(e.title ?? '').replace(/"/g, '""')}"`)].join('\n') + '\n');

  const blank = rows.filter((r) => !r.eventId).length;
  log(`Wrote ${file} (${rows.length} photos, ${blank} without an event) and ${eventsFile} (${events.length} events).`);
  log(`Fill in the eventId column for every row (open thumbnailUrl to see each photo), then run --run --map ${file}.`);
}

// ── --run ────────────────────────────────────────────────────────────────────

async function ensureCollection(env: Env, event: EventRecord, cache: Map<string, PhotoCollection>, now: string): Promise<PhotoCollection> {
  const existing = cache.get(event.id);
  if (existing) return existing;
  const collection: PhotoCollection = {
    id: crypto.randomUUID(),
    entity: 'COLLECTION',
    eventId: event.id,
    title: event.title ?? 'Event photos',
    eventDate: event.date ?? now.slice(0, 10),
    status: 'draft',
    defaultPriceCents: DEFAULT_COLLECTION_PRICE_CENTS,
    defaultPhotographerId: null,
    coverPhotoId: null,
    photoCount: 0,
    forSaleCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: env.collectionsTable, Item: collection }));
  cache.set(event.id, collection);
  log(`  + created collection "${collection.title}" (draft, $15.00)`);
  return collection;
}

async function migrateOne(env: Env, legacy: LegacyPhoto, collection: PhotoCollection, now: string): Promise<void> {
  const source = legacySource(env, legacy.url);
  const ext = originalExt(legacy.url);
  const originalKey = `originals/${legacy.id}.${ext}`;

  const original = await getBytes(source.bucket, source.key);
  await s3.send(new CopyObjectCommand({
    Bucket: env.originalsBucket,
    Key: originalKey,
    CopySource: `${source.bucket}/${source.key}`,
    ContentType: ext === 'png' ? 'image/png' : 'image/jpeg',
    MetadataDirective: 'REPLACE',
  }));

  // Apply EXIF orientation, as the browser does when generating versions.
  const { data, info } = await sharp(original).rotate().toBuffer({ resolveWithObject: true });
  const sizes = versionSizes(info.width, info.height);
  const render = (size: { width: number; height: number }, quality: number, watermark: boolean) => {
    let img = sharp(data).resize(size.width, size.height);
    if (watermark) img = img.composite([{ input: Buffer.from(watermarkSvg(size.width, size.height)) }]);
    return img.jpeg({ quality }).toBuffer();
  };
  const [web, webThumb, preview, thumbnail] = await Promise.all([
    render(sizes.web, 85, false),
    render(sizes.thumb, 80, false),
    render(sizes.preview, 82, true),
    render(sizes.thumb, 80, true),
  ]);

  const keys = libraryKeys(legacy.id, Date.now());
  await Promise.all(([['web', web], ['webThumb', webThumb], ['preview', preview], ['thumbnail', thumbnail]] as const).map(([k, body]) =>
    s3.send(new PutObjectCommand({ Bucket: env.mediaBucket, Key: keys[k], Body: body, ContentType: 'image/jpeg' }))));
  const url = (key: string) => `https://${env.mediaDomain}/${key}`;

  const item = toLibraryPhoto({
    legacy,
    collectionId: collection.id,
    originalKey,
    originalBytes: original.length,
    width: info.width,
    height: info.height,
    contentHash: createHash('sha256').update(original).digest('hex'),
    urls: { webUrl: url(keys.web), webThumbUrl: url(keys.webThumb), previewUrl: url(keys.preview), thumbnailUrl: url(keys.thumbnail) },
    now,
  });
  await ddb.send(new PutCommand({ TableName: env.libraryTable, Item: item, ConditionExpression: 'attribute_not_exists(id)' }));
}

async function run(env: Env, mapFile: string | undefined): Promise<void> {
  if (!mapFile) fail('--run needs --map <csv from --plan>');
  const rows = parseCsv(readFileSync(mapFile, 'utf8'));
  const [photos, events] = await Promise.all([legacyPhotos(env), scanAll<EventRecord>(env.eventsTable)]);
  const eventById = new Map(events.map((e) => [e.id, e]));

  const problems = validateMapping(rows, photos.map((p) => p.id), new Set(eventById.keys()));
  for (const p of photos) {
    try { originalExt(p.url); legacySource(env, p.url); } catch (e) { problems.push(`Photo ${p.id}: ${(e as Error).message}`); }
  }
  if (problems.length) fail(`Mapping problems — nothing was migrated:\n  - ${problems.join('\n  - ')}`);

  const eventFor = new Map(rows.map((r) => [r.legacyId, r.eventId]));
  const collections = new Map<string, PhotoCollection>();
  for (const c of await scanAll<PhotoCollection>(env.collectionsTable)) if (c.entity === 'COLLECTION') collections.set(c.eventId, c);

  const now = new Date().toISOString();
  const added = new Map<string, number>();
  let migrated = 0;
  let skipped = 0;
  for (const [i, legacy] of photos.entries()) {
    const label = `[${i + 1}/${photos.length}] ${legacy.id}`;
    if (await libraryHas(env, legacy.id)) {
      log(`${label} already migrated — skipped`);
      skipped++;
      continue;
    }
    const collection = await ensureCollection(env, eventById.get(eventFor.get(legacy.id)!)!, collections, now);
    await migrateOne(env, legacy, collection, now);
    added.set(collection.id, (added.get(collection.id) ?? 0) + 1);
    migrated++;
    log(`${label} → "${collection.title}"${legacy.visible ? ' (in gallery)' : ''}`);
  }

  for (const [collectionId, count] of added) {
    await ddb.send(new UpdateCommand({
      TableName: env.collectionsTable,
      Key: { id: collectionId },
      UpdateExpression: 'ADD photoCount :n SET updatedAt = :now',
      ExpressionAttributeValues: { ':n': count, ':now': now },
    }));
  }
  log(`\nDone: ${migrated} migrated, ${skipped} already migrated. Next: --verify`);
}

// ── --verify ─────────────────────────────────────────────────────────────────

async function verify(env: Env): Promise<boolean> {
  const photos = await legacyPhotos(env);
  const problems: string[] = [];
  let checked = 0;
  for (const legacy of photos) {
    const r = await ddb.send(new GetCommand({ TableName: env.libraryTable, Key: { id: legacy.id } }));
    const item = r.Item as Record<string, string> | undefined;
    if (!item) { problems.push(`${legacy.id} is not in the library`); continue; }
    for (const field of ['webUrl', 'webThumbUrl', 'previewUrl', 'thumbnailUrl']) {
      const res = await fetch(item[field], { method: 'HEAD' });
      if (!res.ok) problems.push(`${legacy.id} ${field} returned HTTP ${res.status}`);
    }
    checked++;
  }

  const galleryIds: string[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const r = await ddb.send(new QueryCommand({
      TableName: env.libraryTable, IndexName: 'byGallery', KeyConditionExpression: 'galleryKey = :g',
      ExpressionAttributeValues: { ':g': 'GALLERY' }, ExclusiveStartKey: startKey,
    }));
    galleryIds.push(...(r.Items ?? []).map((i) => i.id as string));
    startKey = r.LastEvaluatedKey;
  } while (startKey);
  problems.push(...galleryOrderProblems(photos, galleryIds));

  if (problems.length) {
    log(`✗ ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`);
    return false;
  }
  log(`✓ ${checked} legacy photos are in the library, all public versions load, and gallery order matches.`);
  return true;
}

// ── --cleanup ────────────────────────────────────────────────────────────────

async function cleanup(env: Env): Promise<void> {
  if (!(await verify(env))) fail('Verify failed — fix the problems above before cleaning up.');
  const photos = await legacyPhotos(env);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    `\nThis permanently deletes ${photos.length} legacy gallery records and their public full-resolution files in ${env.name}.\n`
    + `Only do this after PR B (gallery switch) is deployed to ${env.name} and /gallery looks right.\nType "${env.name}" to continue: `,
  );
  rl.close();
  if (answer.trim() !== env.name) fail('Cancelled.');

  for (const legacy of photos) {
    if (!(await libraryHas(env, legacy.id))) { log(`${legacy.id} not migrated — kept`); continue; }
    // Only ever delete files from this environment's own bucket.
    const files = [legacySource(env, legacy.url), legacySource(env, legacy.thumbnailUrl)];
    const own = files.filter((f) => f.bucket === env.mediaBucket);
    await Promise.all(own.map((f) => s3.send(new DeleteObjectCommand({ Bucket: f.bucket, Key: f.key }))));
    await ddb.send(new DeleteCommand({ TableName: env.legacyTable, Key: { id: legacy.id } }));
    log(`${legacy.id} legacy record deleted${own.length ? ' with its files' : ' (files belong to another environment — left in place)'}`);
  }
  log('\nCleanup complete. CloudFront may serve cached copies of the old files until they expire.');
}

// ── CLI ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const flag = (name: string) => args.includes(`--${name}`);
  const value = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };

  const envName = value('env');
  if (!envName) fail('Usage: migrate-gallery.ts --env dev|staging|prod --plan | --run --map <csv> | --verify | --cleanup');
  const env = await resolveEnv(envName);
  log(`Environment: ${env.name} (legacy table ${env.legacyTable} → ${env.libraryTable})\n`);

  if (flag('plan')) await plan(env);
  else if (flag('run')) await run(env, value('map'));
  else if (flag('verify')) { if (!(await verify(env))) process.exit(1); }
  else if (flag('cleanup')) await cleanup(env);
  else fail('Choose one mode: --plan, --run, --verify or --cleanup');
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
