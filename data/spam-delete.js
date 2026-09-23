#!/usr/bin/env node
/**
 * Phase 2 (destructive, guarded) of the bot-spam cleanup.
 *
 * Reads the human-reviewed CSVs produced by data/spam-audit.js and deletes exactly
 * the rows where the "delete" column is yes/y/true — nothing else, ever.
 *
 * Usage (from repo root):
 *   npm run spam-delete:prod                 # dry run — reports what WOULD be deleted
 *   npm run spam-delete:prod:execute          # actually deletes (prod: backs up tables first, then requires a typed confirmation phrase)
 *   NODE_PATH=lambda/node_modules node data/spam-delete.js <staging|prod> [--dir=data/spam-review] [--execute]
 *
 * Requires AWS credentials in the environment (same profile used for CDK).
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { DynamoDBClient, CreateBackupCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const env = process.argv[2];
if (!env || !['staging', 'prod'].includes(env)) {
  console.error('Usage: node data/spam-delete.js <staging|prod> [--dir=data/spam-review] [--execute]');
  process.exit(1);
}

const dirArg = process.argv.find(a => a.startsWith('--dir='));
const dir = dirArg ? dirArg.split('=')[1] : path.join(__dirname, 'spam-review');
const execute = process.argv.includes('--execute');

const prefix = env === 'staging' ? 'staging-' : '';
const TABLE_NAMES = {
  emailSignups: `connect-${prefix}email-signups`,
  artistApplications: `connect-${prefix}artist-applications`,
  sponsorInquiries: `connect-${prefix}sponsor-inquiries`,
};

const CSV_FILES = {
  emailSignups: 'email-signups.csv',
  artistApplications: 'artist-applications.csv',
  sponsorInquiries: 'sponsor-inquiries.csv',
};

function parseCsv(content) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQuotes) {
      if (c === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r') {
      // skip
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0];
  const records = rows.slice(1)
    .map(r => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = r[idx] !== undefined ? r[idx] : ''; });
      return obj;
    })
    .filter(rec => rec.id && rec.id.trim() !== '');
  return { headers, records };
}

function readMarkedRecords() {
  const perTable = {};
  for (const [key, csvFile] of Object.entries(CSV_FILES)) {
    const filePath = path.join(dir, csvFile);
    if (!fs.existsSync(filePath)) {
      console.log(`  (no file found at ${filePath}, skipping ${key})`);
      perTable[key] = [];
      continue;
    }
    const { records } = parseCsv(fs.readFileSync(filePath, 'utf8'));
    const marked = [];
    for (const rec of records) {
      const raw = (rec.delete || '').trim();
      if (raw === '') continue;
      const lower = raw.toLowerCase();
      if (['yes', 'y', 'true'].includes(lower)) {
        marked.push(rec);
      } else if (['no', 'n', 'false'].includes(lower)) {
        // explicit "keep" — reviewed and confirmed, not a typo
      } else {
        console.warn(`  WARNING: unrecognized "delete" value "${raw}" for id=${rec.id} in ${csvFile} — treating as NOT marked, will not be deleted.`);
      }
    }
    perTable[key] = marked;
  }
  return perTable;
}

function confirm(promptText) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(promptText, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

const rawClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(rawClient);

async function createBackups() {
  for (const [key, tableName] of Object.entries(TABLE_NAMES)) {
    const backupName = `${tableName}-pre-spam-delete-${Date.now()}`;
    try {
      const result = await rawClient.send(new CreateBackupCommand({ TableName: tableName, BackupName: backupName }));
      console.log(`  Backup created for ${tableName}: ${result.BackupDetails.BackupArn}`);
    } catch (err) {
      console.error(`  Backup FAILED for ${tableName}:`, err.message || err);
      console.error('\nAborting — no records were deleted because a backup could not be created for every table.');
      process.exit(1);
    }
  }
}

async function main() {
  console.log(`Target env: ${env}`);
  console.log('Target tables:');
  for (const [key, name] of Object.entries(TABLE_NAMES)) {
    console.log(`  ${key}: ${name}`);
  }

  const perTable = readMarkedRecords();
  const total = Object.values(perTable).reduce((sum, m) => sum + m.length, 0);

  console.log('\nPre-flight summary:');
  for (const [key, marked] of Object.entries(perTable)) {
    console.log(`  ${TABLE_NAMES[key]}: ${marked.length} record(s) marked for deletion`);
  }
  console.log(`  Total: ${total} record(s). Mode: ${execute ? 'EXECUTE' : 'DRY RUN'}`);

  if (total === 0) {
    console.log('\nNothing marked for deletion. Exiting.');
    return;
  }

  if (!execute) {
    console.log('\nDry run only — no records were deleted. Re-run with --execute to actually delete.\n');
    for (const [key, marked] of Object.entries(perTable)) {
      for (const rec of marked.slice(0, 10)) {
        console.log(`  [would delete] ${key} id=${rec.id} email=${rec.email || ''} name=${rec.name || rec.fullLegalName || ''}`);
      }
      if (marked.length > 10) console.log(`  ...and ${marked.length - 10} more in ${key}`);
    }
    return;
  }

  if (env === 'prod') {
    console.log('\nNo point-in-time recovery is enabled on these tables — creating on-demand backups before deleting anything...');
    await createBackups();

    const phrase = `DELETE ${total} RECORDS FROM PROD`;
    const answer = await confirm(`\nBackups created above. Type exactly "${phrase}" to proceed: `);
    if (answer.trim() !== phrase) {
      console.log('Confirmation did not match. Aborting — nothing was deleted.');
      process.exit(1);
    }
  } else {
    const answer = await confirm(`\nType "yes" to confirm deleting ${total} record(s) from staging: `);
    if (answer.trim().toLowerCase() !== 'yes') {
      console.log('Aborted.');
      process.exit(1);
    }
  }

  let succeeded = 0;
  let failed = 0;
  for (const [key, marked] of Object.entries(perTable)) {
    const tableName = TABLE_NAMES[key];
    for (const rec of marked) {
      try {
        const existing = await docClient.send(new GetCommand({ TableName: tableName, Key: { id: rec.id } }));
        if (!existing.Item) {
          console.log(`  [skip] ${tableName} id=${rec.id} no longer exists`);
          continue;
        }
        await docClient.send(new DeleteCommand({ TableName: tableName, Key: { id: rec.id } }));
        console.log(`  [deleted] ${tableName} id=${rec.id} email=${rec.email || ''}`);
        succeeded++;
      } catch (err) {
        console.error(`  [FAILED] ${tableName} id=${rec.id}:`, err.message || err);
        failed++;
      }
    }
  }

  console.log(`\nDone. Deleted ${succeeded}, failed ${failed}.`);
  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Delete failed:', err);
    process.exit(1);
  });
}

module.exports = { parseCsv };
