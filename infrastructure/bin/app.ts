#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DnsStack } from '../lib/stacks/dns-stack';
import { DynamoStack } from '../lib/stacks/dynamo-stack';
import { BackendStack } from '../lib/stacks/backend-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';

// Stacks are deployed in this order:
//   Phase 1: DnsStack      ✅ done
//   Phase 2: DynamoStack   ✅ done
//   Phase 3: BackendStack  ✅ done
//   Phase 4: FrontendStack
//
// No NetworkStack — Lambda + DynamoDB communicate over HTTPS.
// No VPC, no NAT Gateway, no RDS Proxy needed.

const app = new cdk.App();

const env = {
  account: '145185391901',
  region: 'us-east-1',
};

const dnsStack = new DnsStack(app, 'ConnectDnsStack', { env });
const dynamoStack = new DynamoStack(app, 'ConnectDynamoStack', { env });
const backendStack = new BackendStack(app, 'ConnectBackendStack', { env, dynamoStack });
new FrontendStack(app, 'ConnectFrontendStack', { env, dnsStack, backendStack });
