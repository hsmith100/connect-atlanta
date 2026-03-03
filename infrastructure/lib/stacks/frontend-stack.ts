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
  backendStack: BackendStack;
  // Omit dnsStack for staging — distribution gets a plain *.cloudfront.net URL.
  // Provide dnsStack for prod — distribution gets connectevents.co + ACM cert.
  dnsStack?: DnsStack;
}

export class FrontendStack extends cdk.Stack {
  public readonly bucketName: string;
  public readonly distributionId: string;
  public readonly distributionUrl: string;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { dnsStack, backendStack } = props;
    const isProd = !!dnsStack;

    // ── S3 bucket ─────────────────────────────────────────────────────────────
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

    // ── CloudFront Function — rewrite extensionless paths to .html ───────────
    // Next.js static export generates /admin.html, /gallery.html, etc.
    // Without this, /admin hits S3, gets a 403 (no such key), and falls back
    // to the 404→index.html error response, rendering the home page instead.
    const rewriteFunction = new cloudfront.Function(this, 'RewriteFunction', {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var uri = event.request.uri;
  if (uri.endsWith('/')) {
    event.request.uri += 'index.html';
  } else if (!uri.includes('.')) {
    event.request.uri += '.html';
  }
  return event.request;
}
      `),
    });

    // ── CloudFront distribution ───────────────────────────────────────────────
    const distribution = new cloudfront.Distribution(this, 'CDN', {
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [{
          function: rewriteFunction,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        }],
      },
      additionalBehaviors: {
        '/api/*': {
          origin: apiOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.seconds(0) },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.seconds(0) },
      ],
      // Prod only — custom domain + ACM cert
      ...(isProd && dnsStack ? {
        certificate: dnsStack.certificate,
        domainNames: ['connectevents.co', 'www.connectevents.co'],
      } : {}),
    });

    // ── Route53 records (prod only) ───────────────────────────────────────────
    if (isProd && dnsStack) {
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

      new route53.AaaaRecord(this, 'ApexAaaaRecord', {
        zone: dnsStack.hostedZone,
        target: cfTarget,
      });

      new route53.AaaaRecord(this, 'WwwAaaaRecord', {
        zone: dnsStack.hostedZone,
        recordName: 'www',
        target: cfTarget,
      });
    }

    this.bucketName = siteBucket.bucketName;
    this.distributionId = distribution.distributionId;
    this.distributionUrl = `https://${distribution.distributionDomainName}`;

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: siteBucket.bucketName,
      description: 'S3 bucket — sync Next.js /out folder here after build',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID — invalidate after deploy',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: this.distributionUrl,
      description: isProd
        ? 'CloudFront URL — test before DNS cutover'
        : 'Staging URL — share this with the team to review changes',
    });
  }
}
