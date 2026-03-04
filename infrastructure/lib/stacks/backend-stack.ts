import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { DynamoStack } from './dynamo-stack';

interface BackendStackProps extends cdk.StackProps {
  dynamoStack: DynamoStack;
  contactEmail?: string;
}

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly apiDomain: string; // hostname only, for CloudFront HttpOrigin
  public readonly mediaBucket: s3.Bucket;
  public readonly mediaDistributionDomain: string;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { dynamoStack, contactEmail = 'info@connectevents.co' } = props;
    const lambdaDir = path.join(__dirname, '../../../lambda/src/handlers');

    // ── Media S3 Bucket ───────────────────────────────────────────────────────
    // Stores uploaded photos and thumbnails. Presigned PUT URLs are issued by
    // PhotosLambda; reads are served via the media CloudFront distribution below.
    const mediaBucket = new s3.Bucket(this, 'MediaBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [{
        allowedMethods: [s3.HttpMethods.PUT],
        // Presigned URL provides auth — allow * so browser uploads work from any origin
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        exposedHeaders: ['ETag'],
      }],
    });
    this.mediaBucket = mediaBucket;

    // ── Media CloudFront Distribution ─────────────────────────────────────────
    // Serves photos/thumbnails via HTTPS. Separate from the main site distribution
    // to avoid circular stack dependencies (main dist needs BackendStack's API domain).
    const mediaOai = new cloudfront.OriginAccessIdentity(this, 'MediaOAI');
    mediaBucket.grantRead(mediaOai);

    const mediaDistribution = new cloudfront.Distribution(this, 'MediaDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(mediaBucket, { originAccessIdentity: mediaOai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });
    this.mediaDistributionDomain = mediaDistribution.distributionDomainName;

    // ── Admin key secret ──────────────────────────────────────────────────────
    // Auto-generated 32-char key. Retrieve with:
    //   aws secretsmanager get-secret-value --secret-id <arn> --query SecretString --output text
    const adminKeySecret = new secretsmanager.Secret(this, 'AdminKeySecret', {
      generateSecretString: { excludePunctuation: true, passwordLength: 32 },
    });

    // ── Events Lambda ─────────────────────────────────────────────────────────
    const eventsLambda = new NodejsFunction(this, 'EventsLambda', {
      entry: path.join(lambdaDir, 'events.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(15),
      environment: {
        EVENTS_TABLE: dynamoStack.eventsTable.tableName,
      },
    });

    dynamoStack.eventsTable.grantReadData(eventsLambda);

    // ── Forms Lambda ──────────────────────────────────────────────────────────
    const formsLambda = new NodejsFunction(this, 'FormsLambda', {
      entry: path.join(lambdaDir, 'forms.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        EMAIL_SIGNUPS_TABLE: dynamoStack.emailSignupsTable.tableName,
        ARTIST_APPLICATIONS_TABLE: dynamoStack.artistApplicationsTable.tableName,
        SPONSOR_INQUIRIES_TABLE: dynamoStack.sponsorInquiriesTable.tableName,
        // Email addresses — not secrets, just config
        CONTACT_EMAIL: contactEmail,
        FROM_EMAIL: 'noreply@connectevents.co',
        // Admin key — shared secret between frontend and forms Lambda
        ADMIN_SECRET_ARN: adminKeySecret.secretArn,
      },
    });

    dynamoStack.emailSignupsTable.grantReadWriteData(formsLambda);
    dynamoStack.artistApplicationsTable.grantReadWriteData(formsLambda);
    dynamoStack.sponsorInquiriesTable.grantReadWriteData(formsLambda);
    adminKeySecret.grantRead(formsLambda);

    // SES send permission — domain verification happens in Phase 5 cutover
    formsLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // ── Photos Lambda ─────────────────────────────────────────────────────────
    const photosLambda = new NodejsFunction(this, 'PhotosLambda', {
      entry: path.join(lambdaDir, 'photos.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        PHOTOS_TABLE: dynamoStack.photosTable.tableName,
        EVENTS_TABLE: dynamoStack.eventsTable.tableName,
        MEDIA_BUCKET: mediaBucket.bucketName,
        CLOUDFRONT_DOMAIN: mediaDistribution.distributionDomainName,
        ADMIN_SECRET_ARN: adminKeySecret.secretArn,
      },
    });

    dynamoStack.photosTable.grantReadWriteData(photosLambda);
    // Write access to events table — admin can update flyerUrl on event records
    dynamoStack.eventsTable.grantReadWriteData(photosLambda);
    mediaBucket.grantReadWrite(photosLambda);
    adminKeySecret.grantRead(photosLambda);

    // ── HTTP API Gateway ──────────────────────────────────────────────────────
    const api = new apigateway.HttpApi(this, 'Api', {
      apiName: 'connect-api',
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PATCH,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['https://connectevents.co', 'https://www.connectevents.co'],
      },
    });

    const eventsIntegration = new HttpLambdaIntegration('EventsIntegration', eventsLambda);
    const formsIntegration = new HttpLambdaIntegration('FormsIntegration', formsLambda);
    const photosIntegration = new HttpLambdaIntegration('PhotosIntegration', photosLambda);

    api.addRoutes({ path: '/api/events', methods: [apigateway.HttpMethod.GET], integration: eventsIntegration });
    api.addRoutes({ path: '/api/events/{id}', methods: [apigateway.HttpMethod.GET], integration: eventsIntegration });
    api.addRoutes({ path: '/api/forms/{proxy+}', methods: [apigateway.HttpMethod.POST], integration: formsIntegration });
    api.addRoutes({ path: '/api/admin/submissions/artists', methods: [apigateway.HttpMethod.GET], integration: formsIntegration });
    api.addRoutes({ path: '/api/admin/submissions/sponsors', methods: [apigateway.HttpMethod.GET], integration: formsIntegration });
    api.addRoutes({ path: '/api/admin/submissions/sponsors/{id}', methods: [apigateway.HttpMethod.PATCH], integration: formsIntegration });
    api.addRoutes({ path: '/api/admin/submissions/email-signups', methods: [apigateway.HttpMethod.GET], integration: formsIntegration });
    api.addRoutes({ path: '/api/gallery', methods: [apigateway.HttpMethod.GET], integration: photosIntegration });
    api.addRoutes({ path: '/api/admin/photos/presign', methods: [apigateway.HttpMethod.POST], integration: photosIntegration });
    api.addRoutes({ path: '/api/admin/photos', methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST, apigateway.HttpMethod.PATCH, apigateway.HttpMethod.DELETE], integration: photosIntegration });
    api.addRoutes({ path: '/api/admin/flyers/presign', methods: [apigateway.HttpMethod.POST], integration: photosIntegration });
    api.addRoutes({ path: '/api/admin/events', methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST], integration: photosIntegration });
    api.addRoutes({ path: '/api/admin/events/{id}', methods: [apigateway.HttpMethod.PATCH, apigateway.HttpMethod.DELETE], integration: photosIntegration });

    this.apiUrl = api.url!;
    // Strip "https://" and trailing "/" to get bare hostname for CloudFront HttpOrigin
    this.apiDomain = cdk.Fn.select(2, cdk.Fn.split('/', api.url!));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
      description: 'API Gateway URL — used by CloudFront in FrontendStack',
    });
    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: mediaBucket.bucketName,
      description: 'S3 bucket for photo uploads',
    });
    new cdk.CfnOutput(this, 'MediaDistributionDomain', {
      value: mediaDistribution.distributionDomainName,
      description: 'CloudFront domain for serving photos (separate from main site)',
    });
    new cdk.CfnOutput(this, 'AdminKeySecretArn', {
      value: adminKeySecret.secretArn,
      description: 'Retrieve admin key: aws secretsmanager get-secret-value --secret-id <arn> --query SecretString --output text',
    });
  }
}
