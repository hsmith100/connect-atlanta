#!/usr/bin/env node
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';

const prNum = process.argv[2];
if (!prNum) {
  console.error('Usage: seed-pr-env.mjs <PR_NUMBER>');
  process.exit(1);
}

const client = new DynamoDBClient({ region: 'us-east-1' });

await client.send(new PutItemCommand({
  TableName: `connect-pr-${prNum}-hero-cards`,
  Item: {
    id: { S: randomUUID() },
    entity: { S: 'hero-card' },
    sortOrder: { N: '1' },
    title: { S: 'Beats on the Beltline' },
    subtitle: { S: 'PR Environment' },
    visible: { BOOL: true },
    createdAt: { S: new Date().toISOString() },
  },
}));

console.log(`Seeded hero card to connect-pr-${prNum}-hero-cards`);
