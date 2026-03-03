import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { DynamoStack } from './dynamo-stack';

interface BackendStackProps extends cdk.StackProps {
  dynamoStack: DynamoStack;
}

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly apiDomain: string; // hostname only, for CloudFront HttpOrigin

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { dynamoStack } = props;
    const lambdaDir = path.join(__dirname, '../../../lambda/src/handlers');

    // Google service account secret — created once via CLI, referenced here by name
    const googleSecret = secretsmanager.Secret.fromSecretNameV2(
      this, 'GoogleServiceAccount', 'connect/google-service-account');

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
        VENDOR_APPLICATIONS_TABLE: dynamoStack.vendorApplicationsTable.tableName,
        VOLUNTEER_APPLICATIONS_TABLE: dynamoStack.volunteerApplicationsTable.tableName,
        ARTIST_APPLICATIONS_TABLE: dynamoStack.artistApplicationsTable.tableName,
        SPONSOR_INQUIRIES_TABLE: dynamoStack.sponsorInquiriesTable.tableName,
        // Email addresses — not secrets, just config
        CONTACT_EMAIL: 'info@connectevents.co',
        FROM_EMAIL: 'noreply@connectevents.co',
        // Google Sheets sync
        GOOGLE_SA_SECRET_ARN: googleSecret.secretArn,
        VENDOR_SHEET_ID: '1SUbvzglTqd6iFmAe69XRB__0APhSKfRUHl1zpHUGs-A',
        ARTIST_SHEET_ID: '1EF3DzG4OjayDjsZtWNezsPh6EwDKKMJWKIAr67LtGls',
        VOLUNTEER_SHEET_ID: '1-V9HV0AJWqdz0yqIrNQuC2quzGGBFGsRGW5hjfbqZCA',
      },
    });

    dynamoStack.emailSignupsTable.grantWriteData(formsLambda);
    dynamoStack.vendorApplicationsTable.grantWriteData(formsLambda);
    dynamoStack.volunteerApplicationsTable.grantWriteData(formsLambda);
    dynamoStack.artistApplicationsTable.grantWriteData(formsLambda);
    dynamoStack.sponsorInquiriesTable.grantWriteData(formsLambda);

    // SES send permission — domain verification happens in Phase 5 cutover
    formsLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // Secrets Manager — read Google service account credentials
    googleSecret.grantRead(formsLambda);

    // ── HTTP API Gateway ──────────────────────────────────────────────────────
    const api = new apigateway.HttpApi(this, 'Api', {
      apiName: 'connect-api',
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['https://connectevents.co', 'https://www.connectevents.co'],
      },
    });

    const eventsIntegration = new HttpLambdaIntegration('EventsIntegration', eventsLambda);
    const formsIntegration = new HttpLambdaIntegration('FormsIntegration', formsLambda);

    api.addRoutes({ path: '/api/events', methods: [apigateway.HttpMethod.GET], integration: eventsIntegration });
    api.addRoutes({ path: '/api/events/{id}', methods: [apigateway.HttpMethod.GET], integration: eventsIntegration });
    api.addRoutes({ path: '/api/forms/{proxy+}', methods: [apigateway.HttpMethod.POST], integration: formsIntegration });

    this.apiUrl = api.url!;
    // Strip "https://" and trailing "/" to get bare hostname for CloudFront HttpOrigin
    this.apiDomain = cdk.Fn.select(2, cdk.Fn.split('/', api.url!));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
      description: 'API Gateway URL — used by CloudFront in FrontendStack',
    });
  }
}
