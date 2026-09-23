#!/usr/bin/env node
/**
 * Phase 1 (read-only) of the bot-spam cleanup.
 *
 * Scores every pending record in connect-email-signups, connect-artist-applications,
 * and connect-sponsor-inquiries for likely bot-spam signals, and writes one CSV per
 * table to --out-dir for manual human review. Nothing is ever deleted here.
 *
 * Usage (from repo root):
 *   npm run spam-audit:prod
 *   NODE_PATH=lambda/node_modules node data/spam-audit.js <staging|prod> [--out-dir=data/spam-review]
 *
 * After running: open each CSV in a spreadsheet, review the score/reasons columns,
 * and type "yes" in the "delete" column for anything confirmed as spam. Save back
 * as .csv (not .xlsx) — data/spam-delete.js reads these same files by header name.
 *
 * Requires AWS credentials in the environment (same profile used for CDK).
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const env = process.argv[2];
if (!env || !['staging', 'prod'].includes(env)) {
  console.error('Usage: node data/spam-audit.js <staging|prod> [--out-dir=data/spam-review]');
  process.exit(1);
}

const outDirArg = process.argv.find(a => a.startsWith('--out-dir='));
const outDir = outDirArg ? outDirArg.split('=')[1] : path.join(__dirname, 'spam-review');

const prefix = env === 'staging' ? 'staging-' : '';
const TABLE_NAMES = {
  emailSignups: `connect-${prefix}email-signups`,
  artistApplications: `connect-${prefix}artist-applications`,
  sponsorInquiries: `connect-${prefix}sponsor-inquiries`,
};

// Turnstile enforcement went live 2026-09-18 15:53:19 -04:00 (commit a2ea35c).
const ENFORCEMENT_CUTOFF_MS = Date.parse('2026-09-18T19:53:19.000Z');

const SPAM_KEYWORDS = [
  'viagra', 'casino', 'crypto', 'bitcoin', 'forex', 'loan', 'seo service',
  'backlink', 'escort', 'porn', 'weight loss', 'click here',
];

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'yopmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com',
]);

// Kept in sync with GENRE_OPTIONS in frontend/components/join/DJApplicationForm.tsx
const GENRE_OPTIONS = [
  'House', 'Afro House', 'Bass House', 'Tech House', 'Disco House',
  'Progressive House', 'Future House', 'Big Room', 'Bass', 'Dubstep',
  'Melodic Dubstep', 'Riddim', 'Drum & Bass', 'Jungle', 'Deep House',
  'UK Garage', 'Bassline', 'Techno', 'Hardstyle', 'Brostep', 'Trap',
  'Future Bass', 'Moombahton', 'Open Format', 'Other (Please fill in below)',
];

function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function emailDomain(email) {
  const m = /@([^\s@]+)$/.exec(email);
  return m ? m[1].toLowerCase() : '';
}

function vowelRatio(str) {
  const letters = str.replace(/[^a-z]/gi, '');
  if (!letters) return 1;
  const vowels = (letters.match(/[aeiou]/gi) || []).length;
  return vowels / letters.length;
}

function emailLocalPartGibberish(email) {
  const local = (email.split('@')[0] || '');
  if (local.length >= 12 && vowelRatio(local) < 0.15) return true;
  if (/^[a-z]{6,}\d{4,}$/i.test(local)) return true;
  return false;
}

function nameGibberish(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (['test test', 'asdf asdf', 'test', 'asdf'].includes(lower)) return true;
  if (/^(.)\1+$/.test(lower.replace(/\s/g, ''))) return true;
  const letters = trimmed.replace(/[^a-z]/gi, '');
  if (letters.length > 4 && !/[aeiou]/i.test(letters)) return true;
  return false;
}

function phoneInvalid(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 10) return true;
  if (/^(\d)\1{9,}$/.test(digits)) return true;
  if (digits === '1234567890') return true;
  return false;
}

function containsSpamKeyword(text) {
  if (!text || typeof text !== 'string') return [];
  const lower = text.toLowerCase();
  const hits = SPAM_KEYWORDS.filter(k => lower.includes(k));
  if (/https?:\/\//i.test(text)) hits.push('bare-url-in-text');
  return hits;
}

function genericShortMessage(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length >= 10) return false;
  return ['hi', 'hello', 'test', 'hey', 'yo'].includes(trimmed);
}

function urlFieldMalformed(value, expectedDomain) {
  if (!value || typeof value !== 'string' || !value.trim()) return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return true;
  }
  if (!/^https?:$/.test(url.protocol)) return true;
  if (expectedDomain && !url.hostname.toLowerCase().includes(expectedDomain)) return true;
  return false;
}

function buildDuplicateFlags(records, fields) {
  const flagged = new Map(); // id -> Set of field names that are duplicated
  for (const field of fields) {
    const groups = new Map();
    for (const r of records) {
      const raw = r[field];
      if (typeof raw !== 'string') continue;
      const norm = raw.trim().toLowerCase().replace(/\s+/g, ' ');
      if (norm.length < 15) continue;
      if (!groups.has(norm)) groups.set(norm, []);
      groups.get(norm).push(r.id);
    }
    for (const ids of groups.values()) {
      if (ids.length < 2) continue;
      for (const id of ids) {
        if (!flagged.has(id)) flagged.set(id, new Set());
        flagged.get(id).add(field);
      }
    }
  }
  return flagged;
}

function buildBurstFlags(records, windowMs = 90000, othersThreshold = 5) {
  const withTime = records
    .map(r => ({ id: r.id, t: Date.parse(r.createdAt) }))
    .filter(r => !Number.isNaN(r.t))
    .sort((a, b) => a.t - b.t);
  const flagged = new Set();
  let left = 0;
  for (let right = 0; right < withTime.length; right++) {
    while (withTime[right].t - withTime[left].t > windowMs) left++;
    const countInWindow = right - left + 1;
    if (countInWindow - 1 >= othersThreshold) {
      for (let k = left; k <= right; k++) flagged.add(withTime[k].id);
    }
  }
  return flagged;
}

function scoreCommon(record, config, duplicateFlags, burstFlags) {
  let score = 0;
  const reasons = [];

  const createdAtMs = Date.parse(record.createdAt);
  if (!Number.isNaN(createdAtMs) && createdAtMs < ENFORCEMENT_CUTOFF_MS) {
    score += 10;
    reasons.push('PRE_ENFORCEMENT');
  }

  const keywordHits = new Set();
  for (const field of config.freeTextFields) {
    containsSpamKeyword(record[field]).forEach(h => keywordHits.add(`${field}:${h}`));
  }
  if (keywordHits.size > 0) {
    score += Math.min(keywordHits.size * 15, 45);
    reasons.push(`SPAM_KEYWORDS(${[...keywordHits].join(',')})`);
  }

  for (const field of config.freeTextFields) {
    if (genericShortMessage(record[field])) {
      score += 10;
      reasons.push(`GENERIC_SHORT_MESSAGE:${field}`);
      break;
    }
  }

  const email = record[config.emailField];
  if (email && typeof email === 'string') {
    if (!isValidEmailFormat(email)) {
      score += 30;
      reasons.push('EMAIL_FORMAT_INVALID');
    } else {
      const domain = emailDomain(email);
      if (DISPOSABLE_DOMAINS.has(domain)) {
        score += 25;
        reasons.push('EMAIL_DISPOSABLE_DOMAIN');
      }
      if (emailLocalPartGibberish(email)) {
        score += 15;
        reasons.push('EMAIL_LOCAL_PART_GIBBERISH');
      }
    }
  }

  const name = config.nameField ? record[config.nameField] : null;
  if (name && nameGibberish(name)) {
    score += 20;
    reasons.push('NAME_GIBBERISH');
  }

  const phone = config.phoneField ? record[config.phoneField] : null;
  if (phone && phoneInvalid(phone)) {
    score += 15;
    reasons.push('PHONE_INVALID');
  }

  const malformedUrlFields = [];
  for (const urlSpec of config.urlFields || []) {
    if (urlFieldMalformed(record[urlSpec.field], urlSpec.domain)) {
      malformedUrlFields.push(urlSpec.field);
    }
  }
  if (malformedUrlFields.length > 0) {
    score += Math.min(malformedUrlFields.length * 10, 30);
    reasons.push(`URL_FIELD_MALFORMED(${malformedUrlFields.join(',')})`);
  }

  if (burstFlags.has(record.id)) {
    score += 20;
    reasons.push('BURST_SUBMISSION');
  }

  const dupFields = duplicateFlags.get(record.id);
  if (dupFields && dupFields.size > 0) {
    score += 25;
    reasons.push(`DUPLICATE_CONTENT(${[...dupFields].join(',')})`);
  }

  return { score, reasons };
}

function scoreArtistExtra(record) {
  let score = 0;
  const reasons = [];
  if (record.mainGenre && !GENRE_OPTIONS.includes(record.mainGenre)) {
    score += 15;
    reasons.push('GENRE_FIELD_NONSENSE:mainGenre');
  }
  if (record.subGenre && !GENRE_OPTIONS.includes(record.subGenre)) {
    score += 15;
    reasons.push('GENRE_FIELD_NONSENSE:subGenre');
  }
  const socialValues = ['instagramLink', 'soundcloudLink', 'spotifyLink']
    .map(f => (record[f] || '').trim());
  const nonEmpty = socialValues.filter(Boolean);
  const allEmpty = nonEmpty.length === 0;
  const allIdentical = nonEmpty.length === socialValues.length && new Set(nonEmpty).size === 1;
  if (allEmpty || allIdentical) {
    score += 20;
    reasons.push('MISSING_SOCIAL_PRESENCE');
  }
  return { score, reasons };
}

function scoreSponsorExtra(record) {
  let score = 0;
  const reasons = [];
  if (Array.isArray(record.yearsInterested) && record.yearsInterested.length === 0) {
    score += 5;
    reasons.push('YEARS_INTERESTED_EMPTY');
  }
  return { score, reasons };
}

const TABLE_CONFIGS = {
  emailSignups: {
    csvFile: 'email-signups.csv',
    nameField: 'name',
    emailField: 'email',
    phoneField: 'phone',
    freeTextFields: ['subject', 'message'],
    urlFields: [],
    duplicateFields: ['message'],
    columns: ['id', 'createdAt', 'source', 'name', 'email', 'phone', 'marketingConsent', 'subject', 'message', 'score', 'reasons', 'delete'],
  },
  artistApplications: {
    csvFile: 'artist-applications.csv',
    nameField: 'fullLegalName',
    emailField: 'email',
    phoneField: 'phone',
    freeTextFields: ['artistBio', 'additionalInfo'],
    urlFields: [
      { field: 'instagramLink', domain: 'instagram.com' },
      { field: 'soundcloudLink', domain: 'soundcloud.com' },
      { field: 'spotifyLink', domain: 'spotify.com' },
      { field: 'livePerformanceLinks', domain: null },
      { field: 'promoKitLinks', domain: null },
    ],
    duplicateFields: ['artistBio', 'additionalInfo'],
    extraScorer: scoreArtistExtra,
    columns: ['id', 'createdAt', 'updatedAt', 'email', 'fullLegalName', 'djName', 'city', 'phone', 'instagramLink', 'contactMethod', 'mainGenre', 'subGenre', 'artistBio', 'additionalInfo', 'promoKitLinks', 'soundcloudLink', 'spotifyLink', 'livePerformanceLinks', 'score', 'reasons', 'delete'],
  },
  sponsorInquiries: {
    csvFile: 'sponsor-inquiries.csv',
    nameField: 'name',
    emailField: 'email',
    phoneField: 'phone',
    freeTextFields: ['productIndustry', 'notes', 'company'],
    urlFields: [],
    duplicateFields: ['productIndustry', 'notes', 'company'],
    extraScorer: scoreSponsorExtra,
    columns: ['id', 'createdAt', 'name', 'email', 'phone', 'company', 'productIndustry', 'yearsInterested', 'notes', 'score', 'reasons', 'delete'],
  },
};

function csvEscape(value) {
  if (value === null || value === undefined) return '""';
  let str = Array.isArray(value) ? value.join('; ') : String(value);
  str = str.replace(/\r\n|\r|\n/g, '\\n').replace(/"/g, '""');
  return `"${str}"`;
}

function writeCsv(filePath, columns, rows) {
  const header = columns.map(csvEscape).join(',');
  const lines = rows.map(row => columns.map(col => csvEscape(row[col])).join(','));
  fs.writeFileSync(filePath, [header, ...lines].join('\n') + '\n', 'utf8');
}

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

async function queryAllPending(tableName) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const result = await client.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byStatus',
      KeyConditionExpression: '#s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'pending' },
      ExclusiveStartKey,
    }));
    items.push(...(result.Items || []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

function confirm(promptText) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(promptText, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log(`Target env: ${env}`);
  console.log('Target tables (read-only):');
  for (const [key, name] of Object.entries(TABLE_NAMES)) {
    console.log(`  ${key}: ${name}`);
  }

  const answer = await confirm('\nThis will read the above tables. Continue? [y/N] ');
  if (answer.toLowerCase() !== 'y') {
    console.log('Aborted.');
    process.exit(0);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const summary = [];

  for (const [key, config] of Object.entries(TABLE_CONFIGS)) {
    const tableName = TABLE_NAMES[key];
    console.log(`\nScanning ${tableName}...`);
    const records = await queryAllPending(tableName);
    console.log(`  ${records.length} records found.`);

    const duplicateFlags = buildDuplicateFlags(records, config.duplicateFields);
    const burstFlags = buildBurstFlags(records);

    const scored = records.map(record => {
      const common = scoreCommon(record, config, duplicateFlags, burstFlags);
      const extra = config.extraScorer ? config.extraScorer(record) : { score: 0, reasons: [] };
      const score = Math.min(common.score + extra.score, 100);
      return { ...record, score, reasons: [...common.reasons, ...extra.reasons].join('; '), delete: '' };
    });

    scored.sort((a, b) => b.score - a.score);

    const outPath = path.join(outDir, config.csvFile);
    writeCsv(outPath, config.columns, scored);
    console.log(`  Wrote ${outPath}`);

    summary.push({
      key,
      total: records.length,
      likely: scored.filter(r => r.score >= 60).length,
      worth: scored.filter(r => r.score >= 30 && r.score < 60).length,
      low: scored.filter(r => r.score < 30).length,
    });
  }

  console.log('\nSummary:');
  for (const s of summary) {
    console.log(`  ${s.key}: ${s.total} total — likely spam (>=60): ${s.likely}, worth a look (30-59): ${s.worth}, probably legit (<30): ${s.low}`);
  }
  console.log(`\nReview the CSVs in ${outDir}, fill in "delete" (yes/no) per row, save as .csv, then run spam-delete.js.`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
}

module.exports = {
  scoreCommon,
  scoreArtistExtra,
  scoreSponsorExtra,
  buildDuplicateFlags,
  buildBurstFlags,
  TABLE_CONFIGS,
  writeCsv,
};
