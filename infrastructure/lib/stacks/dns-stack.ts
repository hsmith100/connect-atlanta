import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export class DnsStack extends cdk.Stack {
  public readonly hostedZone: route53.HostedZone;
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Route53 hosted zone for connectevents.co.
    // The nameservers output below will be set at the domain registrar during
    // Phase 5 (cutover). Until then, existing DNS keeps serving the old site.
    this.hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: 'connectevents.co',
    });

    // ACM certificate — covers apex and www.
    // Must live in us-east-1 to be used with CloudFront.
    //
    // IMPORTANT — during `cdk deploy ConnectDnsStack`:
    // CloudFormation will pause waiting for cert validation. To unblock it:
    //   1. Open AWS Console → Route53 → connectevents.co hosted zone
    //   2. Find the CNAME record that was auto-created for validation
    //   3. Add that exact CNAME to your current DNS provider (GoDaddy, Cloudflare, etc.)
    //   4. Wait ~5 minutes for propagation — CloudFormation will detect it and continue
    //
    // This validates the cert WITHOUT switching any traffic to AWS yet.
    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: 'connectevents.co',
      subjectAlternativeNames: ['www.connectevents.co'],
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: cdk.Fn.join(', ', this.hostedZone.hostedZoneNameServers!),
      description: 'Set these at your domain registrar during Phase 5 cutover',
    });

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      description: 'ACM Certificate ARN — used by CloudFront in FrontendStack',
    });
  }
}
