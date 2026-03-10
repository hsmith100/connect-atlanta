#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DnsStack } from '../lib/stacks/dns-stack';
import { DynamoStack } from '../lib/stacks/dynamo-stack';
import { BackendStack } from '../lib/stacks/backend-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { CiStack } from '../lib/stacks/ci-stack';

// Stacks are deployed in this order:
//   Phase 1: DnsStack      ✅ done
//   Phase 2: DynamoStack   ✅ done
//   Phase 3: BackendStack  ✅ done
//   Phase 4: FrontendStack ✅ done
//
// No NetworkStack — Lambda + DynamoDB communicate over HTTPS.
// No VPC, no NAT Gateway, no RDS Proxy needed.

const app = new cdk.App();

const env = {
  account: '145185391901',
  region: 'us-east-1',
};

// ── Production ────────────────────────────────────────────────────────────────
const dnsStack = new DnsStack(app, 'ConnectDnsStack', { env });
const dynamoStack = new DynamoStack(app, 'ConnectDynamoStack', { env });
const backendStack = new BackendStack(app, 'ConnectBackendStack', { env, dynamoStack });
new FrontendStack(app, 'ConnectFrontendStack', { env, dnsStack, backendStack });

// ── CI/CD ─────────────────────────────────────────────────────────────────────
// OIDC provider + IAM role for GitHub Actions — one per account
new CiStack(app, 'ConnectCiStack', { env });

// ── Staging ───────────────────────────────────────────────────────────────────
// Prod-like environment — deployed on every push to main before production.
// Used for regression testing and admin QA before touching prod data.
const stagingDynamoStack = new DynamoStack(app, 'ConnectStagingDynamoStack', { env, tablePrefix: 'staging-' });
const stagingBackendStack = new BackendStack(app, 'ConnectStagingBackendStack', { env, dynamoStack: stagingDynamoStack, contactEmail: 'productions.connectatlanta@gmail.com' });
new FrontendStack(app, 'ConnectStagingFrontendStack', { env, backendStack: stagingBackendStack });

// ── Dev ───────────────────────────────────────────────────────────────────────
// Persistent environment for local development. Lambda + DynamoDB only —
// no CloudFront (PR envs each get their own ephemeral frontend).
const devDynamoStack = new DynamoStack(app, 'ConnectDevDynamoStack', { env, tablePrefix: 'dev-' });
const devBackendStack = new BackendStack(app, 'ConnectDevBackendStack', { env, dynamoStack: devDynamoStack, contactEmail: 'productions.connectatlanta@gmail.com' });

// ── Per-PR ephemeral environments ─────────────────────────────────────────────
// Created on-demand via: cdk deploy ... --context pr=<PR_NUMBER>
// Destroyed automatically when the PR closes via pr-cleanup.yml
const prNum = app.node.tryGetContext('pr');
if (prNum) {
  const prDynamoStack = new DynamoStack(app, `ConnectPR${prNum}DynamoStack`, {
    env, tablePrefix: `pr-${prNum}-`, ephemeral: true,
  });
  const prBackendStack = new BackendStack(app, `ConnectPR${prNum}BackendStack`, {
    env, dynamoStack: prDynamoStack,
    contactEmail: 'productions.connectatlanta@gmail.com',
    ephemeral: true,
  });
  new FrontendStack(app, `ConnectPR${prNum}FrontendStack`, {
    env, backendStack: prBackendStack, ephemeral: true,
  });
}
