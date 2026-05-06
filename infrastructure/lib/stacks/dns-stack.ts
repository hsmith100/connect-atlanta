import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export class DnsStack extends cdk.Stack {
  public readonly hostedZone: route53.HostedZone;
  public readonly certificate: acm.Certificate;
  public readonly beatsontheblockfestHostedZone: route53.HostedZone;
  public readonly beatsontheblockfestCertificate: acm.Certificate;

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

    // Google Workspace MX records for info@connectevents.co
    new route53.MxRecord(this, 'GoogleWorkspaceMx', {
      zone: this.hostedZone,
      values: [
        { priority: 1,  hostName: 'aspmx.l.google.com' },
        { priority: 5,  hostName: 'alt1.aspmx.l.google.com' },
        { priority: 5,  hostName: 'alt2.aspmx.l.google.com' },
        { priority: 10, hostName: 'alt3.aspmx.l.google.com' },
        { priority: 10, hostName: 'alt4.aspmx.l.google.com' },
      ],
    });

    // SPF record — authorizes Google Workspace to send on behalf of connectevents.co.
    // Without this, receiving servers reject outbound mail as "unauthenticated".
    new route53.TxtRecord(this, 'SpfRecord', {
      zone: this.hostedZone,
      values: ['v=spf1 include:_spf.google.com ~all'],
    });

    // SendGrid email authentication for PeerPop marketing campaigns.
    // These records allow receiving mail servers to verify that emails sent through
    // PeerPop/SendGrid on behalf of connectevents.co are legitimate.
    new route53.CnameRecord(this, 'SendGridEmailTracking', {
      zone: this.hostedZone,
      recordName: 'em335',
      domainName: 'u40615086.wl087.sendgrid.net',
    });

    new route53.CnameRecord(this, 'SendGridDkimKey1', {
      zone: this.hostedZone,
      recordName: 's1._domainkey',
      domainName: 's1.domainkey.u40615086.wl087.sendgrid.net',
    });

    new route53.CnameRecord(this, 'SendGridDkimKey2', {
      zone: this.hostedZone,
      recordName: 's2._domainkey',
      domainName: 's2.domainkey.u40615086.wl087.sendgrid.net',
    });

    // DMARC monitoring policy — p=none means monitor only, no mail is blocked.
    new route53.TxtRecord(this, 'DmarcRecord', {
      zone: this.hostedZone,
      recordName: '_dmarc',
      values: ['v=DMARC1; p=none;'],
    });

    // Route53 hosted zone for beatsontheblockfest.com (rebrand primary domain).
    // After deploying, update Namecheap nameservers for beatsontheblockfest.com
    // to the Route53 NS values in the BeatsNameServers output below.
    this.beatsontheblockfestHostedZone = new route53.HostedZone(this, 'BeatsHostedZone', {
      zoneName: 'beatsontheblockfest.com',
    });

    // ACM certificate for beatsontheblockfest.com — covers apex and www.
    // Must live in us-east-1 for CloudFront. CDK auto-creates the DNS validation
    // CNAME in the hosted zone above; cert validates once Namecheap NS are updated.
    this.beatsontheblockfestCertificate = new acm.Certificate(this, 'BeatsCertificate', {
      domainName: 'beatsontheblockfest.com',
      subjectAlternativeNames: ['www.beatsontheblockfest.com'],
      validation: acm.CertificateValidation.fromDns(this.beatsontheblockfestHostedZone),
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

    new cdk.CfnOutput(this, 'BeatsHostedZoneId', {
      value: this.beatsontheblockfestHostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID for beatsontheblockfest.com',
    });

    new cdk.CfnOutput(this, 'BeatsNameServers', {
      value: cdk.Fn.join(', ', this.beatsontheblockfestHostedZone.hostedZoneNameServers!),
      description: 'Set these as Namecheap custom nameservers for beatsontheblockfest.com',
    });

    new cdk.CfnOutput(this, 'BeatsCertificateArn', {
      value: this.beatsontheblockfestCertificate.certificateArn,
      description: 'ACM Certificate ARN for beatsontheblockfest.com — used by BeatsCDN in FrontendStack',
    });
  }
}
