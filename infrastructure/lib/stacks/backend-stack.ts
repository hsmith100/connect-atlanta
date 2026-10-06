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
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { DynamoStack } from './dynamo-stack';

interface BackendStackProps extends cdk.StackProps {
  dynamoStack: DynamoStack;
  contactEmail?: string;
  alertEmail?: string;
  // When true, media bucket uses DESTROY policy and SNS alarm is skipped (ephemeral PR environments).
  ephemeral?: boolean;
  // Seeds the Turnstile secret with a known value (e.g. Cloudflare's always-pass dummy
  // secret key) instead of auto-generating a placeholder. Used for dev/PR environments
  // so they work out of the box with no manual Secrets Manager write.
  turnstileSecretValue?: string;
  // Which site origins the photo store accepts for redirects and email links.
  // 'prod' = the four production domains only; 'any-cloudfront' also allows *.cloudfront.net and localhost.
  siteOriginMode?: 'prod' | 'any-cloudfront';
  // Stripe secret ownership: 'own' creates one per stack (prod/staging), 'devShared' creates the
  // named connect-dev-stripe secret (dev), 'importDev' reuses it (ephemeral PR environments).
  stripeSecretMode?: 'own' | 'devShared' | 'importDev';
}

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly apiDomain: string; // hostname only, for CloudFront HttpOrigin
  public readonly mediaBucket: s3.Bucket;
  public readonly mediaDistributionDomain: string;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const {
      dynamoStack, contactEmail = 'info@beatsontheblockfest.com', alertEmail = 'productions.connectatlanta@gmail.com',
      ephemeral = false, turnstileSecretValue, siteOriginMode = 'any-cloudfront', stripeSecretMode = 'own',
    } = props;
    const lambdaDir = path.join(__dirname, '../../../lambda/src/handlers');

    // ── Media S3 Bucket ───────────────────────────────────────────────────────
    // Stores uploaded photos and thumbnails. Presigned PUT URLs are issued by
    // PhotosLambda; reads are served via the media CloudFront distribution below.
    const mediaBucket = new s3.Bucket(this, 'MediaBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: ephemeral ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: ephemeral,
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

    // ── Store originals bucket ────────────────────────────────────────────────
    // Full-quality photos for sale. Private: no CloudFront distribution, no public
    // policy. Only StoreLambda can read it, issuing short-lived pre-signed GET URLs
    // to buyers with a valid download token.
    const storeOriginalsBucket = new s3.Bucket(this, 'StoreOriginalsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: ephemeral ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: ephemeral,
      cors: [{
        allowedMethods: [s3.HttpMethods.PUT],
        // Presigned URL provides auth — allow * so admin browser uploads work from any origin
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        exposedHeaders: ['ETag'],
      }],
      lifecycleRules: [{
        transitions: [{ storageClass: s3.StorageClass.INTELLIGENT_TIERING, transitionAfter: cdk.Duration.days(30) }],
      }],
    });

    // ── Admin key secret ──────────────────────────────────────────────────────
    // Auto-generated 32-char key. Retrieve with:
    //   aws secretsmanager get-secret-value --secret-id <arn> --query SecretString --output text
    const adminKeySecret = new secretsmanager.Secret(this, 'AdminKeySecret', {
      generateSecretString: { excludePunctuation: true, passwordLength: 32 },
    });

    // ── Turnstile secret key ──────────────────────────────────────────────────
    // Real (prod/staging) environments get an auto-generated placeholder here;
    // the actual Cloudflare-issued secret key is written manually after deploy:
    //   aws secretsmanager put-secret-value --secret-id <arn> --secret-string <cloudflare-secret-key>
    // Dev/PR environments pass turnstileSecretValue (Cloudflare's always-pass dummy
    // secret key) so they work with zero manual setup.
    const turnstileSecret = new secretsmanager.Secret(this, 'TurnstileSecretKey', {
      secretStringValue: turnstileSecretValue ? cdk.SecretValue.unsafePlainText(turnstileSecretValue) : undefined,
      generateSecretString: turnstileSecretValue ? undefined : { excludePunctuation: true, passwordLength: 32 },
    });

    // ── Stripe secret ─────────────────────────────────────────────────────────
    // JSON {"secretKey":"sk_...","webhookSecret":"whsec_..."}, written manually after deploy:
    //   aws secretsmanager put-secret-value --secret-id <arn> --secret-string '{"secretKey":"sk_...","webhookSecret":"whsec_..."}'
    // Until written, the generated placeholder makes checkout return 503 (browsing still works).
    const stripeSecret: secretsmanager.ISecret = stripeSecretMode === 'importDev'
      ? secretsmanager.Secret.fromSecretNameV2(this, 'StripeSecret', 'connect-dev-stripe')
      : new secretsmanager.Secret(this, 'StripeSecret', {
        secretName: stripeSecretMode === 'devShared' ? 'connect-dev-stripe' : undefined,
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
      depsLockFilePath: path.join(__dirname, '../../../lambda/package-lock.json'),
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
      depsLockFilePath: path.join(__dirname, '../../../lambda/package-lock.json'),
      environment: {
        EMAIL_SIGNUPS_TABLE: dynamoStack.emailSignupsTable.tableName,
        ARTIST_APPLICATIONS_TABLE: dynamoStack.artistApplicationsTable.tableName,
        SPONSOR_INQUIRIES_TABLE: dynamoStack.sponsorInquiriesTable.tableName,
        // Email addresses — not secrets, just config
        CONTACT_EMAIL: contactEmail,
        FROM_EMAIL: 'noreply@beatsontheblockfest.com',
        // Admin key — shared secret between frontend and forms Lambda
        ADMIN_SECRET_ARN: adminKeySecret.secretArn,
        // Cloudflare Turnstile bot verification
        TURNSTILE_SECRET_ARN: turnstileSecret.secretArn,
        // Real Cloudflare Turnstile verification confirmed working on production
        // (2026-09-18) — bot submissions without a valid token are now rejected.
        TURNSTILE_ENFORCE: 'true',
      },
    });

    dynamoStack.emailSignupsTable.grantReadWriteData(formsLambda);
    dynamoStack.artistApplicationsTable.grantReadWriteData(formsLambda);
    dynamoStack.sponsorInquiriesTable.grantReadWriteData(formsLambda);
    adminKeySecret.grantRead(formsLambda);
    turnstileSecret.grantRead(formsLambda);

    // SES send permission — beatsontheblockfest.com and connectevents.co both verified in ConnectDnsStack
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
      depsLockFilePath: path.join(__dirname, '../../../lambda/package-lock.json'),
      environment: {
        PHOTOS_TABLE: dynamoStack.photosTable.tableName,
        EVENTS_TABLE: dynamoStack.eventsTable.tableName,
        HERO_CARDS_TABLE: dynamoStack.heroCardsTable.tableName,
        MEDIA_BUCKET: mediaBucket.bucketName,
        CLOUDFRONT_DOMAIN: mediaDistribution.distributionDomainName,
        ADMIN_SECRET_ARN: adminKeySecret.secretArn,
      },
    });

    dynamoStack.photosTable.grantReadWriteData(photosLambda);
    dynamoStack.heroCardsTable.grantReadWriteData(photosLambda);
    // Write access to events table — admin can update flyerUrl on event records
    dynamoStack.eventsTable.grantReadWriteData(photosLambda);
    mediaBucket.grantReadWrite(photosLambda);
    adminKeySecret.grantRead(photosLambda);

    // ── Store Lambda ──────────────────────────────────────────────────────────
    // Photo store: public browsing/checkout/downloads, Stripe webhook, and admin store routes.
    // Separate from PhotosLambda so only store code can read originals and the Stripe secret.
    const storeLambda = new NodejsFunction(this, 'StoreLambda', {
      entry: path.join(lambdaDir, 'store.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      depsLockFilePath: path.join(__dirname, '../../../lambda/package-lock.json'),
      environment: {
        STORE_COLLECTIONS_TABLE: dynamoStack.storeCollectionsTable.tableName,
        STORE_PHOTOS_TABLE: dynamoStack.storePhotosTable.tableName,
        STORE_PHOTOGRAPHERS_TABLE: dynamoStack.storePhotographersTable.tableName,
        STORE_ORDERS_TABLE: dynamoStack.storeOrdersTable.tableName,
        EVENTS_TABLE: dynamoStack.eventsTable.tableName,
        MEDIA_BUCKET: mediaBucket.bucketName,
        CLOUDFRONT_DOMAIN: mediaDistribution.distributionDomainName,
        ORIGINALS_BUCKET: storeOriginalsBucket.bucketName,
        ADMIN_SECRET_ARN: adminKeySecret.secretArn,
        STRIPE_SECRET_ARN: stripeSecret.secretArn,
        TURNSTILE_SECRET_ARN: turnstileSecret.secretArn,
        CONTACT_EMAIL: contactEmail,
        FROM_EMAIL: 'noreply@beatsontheblockfest.com',
        SITE_ORIGIN_MODE: siteOriginMode,
      },
    });

    dynamoStack.storeCollectionsTable.grantReadWriteData(storeLambda);
    dynamoStack.storePhotosTable.grantReadWriteData(storeLambda);
    dynamoStack.storePhotographersTable.grantReadWriteData(storeLambda);
    dynamoStack.storeOrdersTable.grantReadWriteData(storeLambda);
    dynamoStack.eventsTable.grantReadData(storeLambda);
    mediaBucket.grantReadWrite(storeLambda);
    storeOriginalsBucket.grantReadWrite(storeLambda);
    adminKeySecret.grantRead(storeLambda);
    stripeSecret.grantRead(storeLambda);
    turnstileSecret.grantRead(storeLambda);
    storeLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // ── HTTP API Gateway ──────────────────────────────────────────────────────
    const api = new apigateway.HttpApi(this, 'Api', {
      apiName: 'connect-api',
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PATCH,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ephemeral
          ? ['*']
          : ['https://beatsontheblockfest.com', 'https://www.beatsontheblockfest.com', 'https://connectevents.co', 'https://www.connectevents.co'],
      },
    });

    const eventsIntegration = new HttpLambdaIntegration('EventsIntegration', eventsLambda);
    const formsIntegration = new HttpLambdaIntegration('FormsIntegration', formsLambda);
    const photosIntegration = new HttpLambdaIntegration('PhotosIntegration', photosLambda);
    const storeIntegration = new HttpLambdaIntegration('StoreIntegration', storeLambda);

    api.addRoutes({ path: '/api/events', methods: [apigateway.HttpMethod.GET], integration: eventsIntegration });
    api.addRoutes({ path: '/api/events/{id}', methods: [apigateway.HttpMethod.GET], integration: eventsIntegration });
    api.addRoutes({ path: '/api/youtube/latest-video', methods: [apigateway.HttpMethod.GET], integration: eventsIntegration });
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
    api.addRoutes({ path: '/api/hero-cards', methods: [apigateway.HttpMethod.GET], integration: photosIntegration });
    api.addRoutes({ path: '/api/admin/hero-cards', methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST], integration: photosIntegration });
    api.addRoutes({ path: '/api/admin/hero-cards/presign', methods: [apigateway.HttpMethod.POST], integration: photosIntegration });
    api.addRoutes({ path: '/api/admin/hero-cards/{id}', methods: [apigateway.HttpMethod.PATCH, apigateway.HttpMethod.DELETE], integration: photosIntegration });
    api.addRoutes({ path: '/api/store/{proxy+}', methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST], integration: storeIntegration });
    api.addRoutes({ path: '/api/admin/store/{proxy+}', methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST, apigateway.HttpMethod.PATCH, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE], integration: storeIntegration });

    // ── Access logging ────────────────────────────────────────────────────────
    const accessLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── Throttling ────────────────────────────────────────────────────────────
    // Stage-level defaults protect all routes from abuse.
    // 20 req/sec sustained, burst of 50 — plenty for a landing page.
    // API Gateway returns 429 Too Many Requests when exceeded.
    const cfnStage = api.defaultStage?.node.defaultChild as apigateway.CfnStage;
    cfnStage.defaultRouteSettings = {
      throttlingRateLimit: 20,
      throttlingBurstLimit: 50,
    };
    cfnStage.accessLogSettings = {
      destinationArn: accessLogGroup.logGroupArn,
      format: JSON.stringify({
        requestId: '$context.requestId',
        ip: '$context.identity.sourceIp',
        requestTime: '$context.requestTime',
        httpMethod: '$context.httpMethod',
        routeKey: '$context.routeKey',
        status: '$context.status',
        responseLength: '$context.responseLength',
      }),
    };

    // ── Throttle alarm ────────────────────────────────────────────────────────
    // Alert when 10+ requests are throttled in a 5-minute window.
    // Skipped for ephemeral PR environments to avoid spurious confirmation emails.
    if (!ephemeral) {
      const throttleMetric = new logs.MetricFilter(this, 'ThrottleMetricFilter', {
        logGroup: accessLogGroup,
        metricNamespace: 'ConnectAPI',
        metricName: 'ThrottledRequests',
        filterPattern: logs.FilterPattern.stringValue('$.status', '=', '429'),
        metricValue: '1',
      });

      const alertTopic = new sns.Topic(this, 'AlertTopic');
      alertTopic.addSubscription(new snsSubscriptions.EmailSubscription(alertEmail));

      new cloudwatch.Alarm(this, 'ThrottleAlarm', {
        metric: throttleMetric.metric({ statistic: 'Sum', period: cdk.Duration.minutes(5) }),
        threshold: 10,
        evaluationPeriods: 1,
        alarmDescription: 'More than 10 API requests throttled in 5 minutes — possible abuse or traffic spike',
      }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
    }

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
    new cdk.CfnOutput(this, 'StoreOriginalsBucketName', {
      value: storeOriginalsBucket.bucketName,
      description: 'Private S3 bucket for full-quality store photos (no public access)',
    });
    new cdk.CfnOutput(this, 'StripeSecretArn', {
      value: stripeSecret.secretArn,
      description: `aws secretsmanager put-secret-value --secret-id <arn> --secret-string '{"secretKey":"sk_...","webhookSecret":"whsec_..."}'`,
    });
    new cdk.CfnOutput(this, 'TurnstileSecretArn', {
      value: turnstileSecret.secretArn,
      description: 'Write real Cloudflare Turnstile secret key: aws secretsmanager put-secret-value --secret-id <arn> --secret-string <cloudflare-secret-key>',
    });
  }
}
