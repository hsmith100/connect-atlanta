#!/usr/bin/env node
/**
 * Seed the connect-events DynamoDB table.
 *
 * Usage (from repo root):
 *   npm run seed:staging   — seeds the staging table (connect-staging-events)
 *   npm run seed:prod      — seeds the production table (connect-events)
 *
 * Requires AWS credentials in the environment (same profile used for CDK).
 * Runs from the lambda/ directory so @aws-sdk deps resolve from lambda/node_modules.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const path = require('path');

const env = process.argv[2];
if (!env || !['staging', 'prod'].includes(env)) {
  console.error('Usage: node data/seed.js <staging|prod>');
  process.exit(1);
}

const TABLE_NAME = env === 'staging' ? 'connect-staging-events' : 'connect-events';
const events = require(path.join(__dirname, 'seed-events.json'));

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

async function seed() {
  console.log(`Seeding ${events.length} events into ${TABLE_NAME}...`);

  // BatchWrite supports max 25 items per request
  const chunks = [];
  for (let i = 0; i < events.length; i += 25) {
    chunks.push(events.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    await client.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: chunk.map(item => ({ PutRequest: { Item: item } })),
      },
    }));
  }

  console.log(`Done. ${events.length} events written to ${TABLE_NAME}.`);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
