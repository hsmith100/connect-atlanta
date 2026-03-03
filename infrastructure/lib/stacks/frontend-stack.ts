import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { DnsStack } from './dns-stack';
import { BackendStack } from './backend-stack';

interface FrontendStackProps extends cdk.StackProps {
  dnsStack: DnsStack;
  backendStack: BackendStack;
}

export class FrontendStack extends cdk.Stack {
  public readonly bucketName: string;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { dnsStack, backendStack } = props;

    // ── S3 bucket ─────────────────────────────────────────────────────────────
    // Private — CloudFront accesses it via OAI, never public.
    const siteBucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── CloudFront OAI ────────────────────────────────────────────────────────
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    siteBucket.grantRead(oai);

    // ── Origins ───────────────────────────────────────────────────────────────
    const s3Origin = new origins.S3Origin(siteBucket, { originAccessIdentity: oai });

    const apiOrigin = new origins.HttpOrigin(backendStack.apiDomain, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    });

    // ── CloudFront distribution ───────────────────────────────────────────────
    const distribution = new cloudfront.Distribution(this, 'CDN', {
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        // /api/* → API Gateway → Lambda. Caching disabled, all methods allowed.
        '/api/*': {
          origin: apiOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      defaultRootObject: 'index.html',
      // Route unknown paths to index.html so Next.js client-side routing works
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.seconds(0) },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.seconds(0) },
      ],
      certificate: dnsStack.certificate,
      domainNames: ['connectevents.co', 'www.connectevents.co'],
    });

    // ── Route53 records ───────────────────────────────────────────────────────
    // These are added now but only go live in Phase 5 when nameservers switch.
    const cfTarget = route53.RecordTarget.fromAlias(
      new route53Targets.CloudFrontTarget(distribution),
    );

    new route53.ARecord(this, 'ApexARecord', {
      zone: dnsStack.hostedZone,
      target: cfTarget,
    });

    new route53.ARecord(this, 'WwwARecord', {
      zone: dnsStack.hostedZone,
      recordName: 'www',
      target: cfTarget,
    });

    // IPv6
    new route53.AaaaRecord(this, 'ApexAaaaRecord', {
      zone: dnsStack.hostedZone,
      target: cfTarget,
    });

    new route53.AaaaRecord(this, 'WwwAaaaRecord', {
      zone: dnsStack.hostedZone,
      recordName: 'www',
      target: cfTarget,
    });

    this.bucketName = siteBucket.bucketName;
    this.distributionId = distribution.distributionId;

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: siteBucket.bucketName,
      description: 'S3 bucket — GitHub Actions syncs the Next.js /out folder here',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID — GitHub Actions invalidates cache after deploy',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront URL — test the site here before Phase 5 DNS cutover',
    });
  }
}
