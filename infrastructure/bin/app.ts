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
// Full staging environment — S3 + CloudFront (no custom domain) + Lambda + DynamoDB.
// Staging CloudFront URL is shared with the team to review changes before prod.
const stagingDynamoStack = new DynamoStack(app, 'ConnectStagingDynamoStack', { env, tablePrefix: 'staging-' });
const stagingBackendStack = new BackendStack(app, 'ConnectStagingBackendStack', { env, dynamoStack: stagingDynamoStack });
new FrontendStack(app, 'ConnectStagingFrontendStack', { env, backendStack: stagingBackendStack });
