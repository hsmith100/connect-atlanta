import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DynamoStack extends cdk.Stack {
  public readonly eventsTable: dynamodb.Table;
  public readonly emailSignupsTable: dynamodb.Table;
  public readonly vendorApplicationsTable: dynamodb.Table;
  public readonly volunteerApplicationsTable: dynamodb.Table;
  public readonly artistApplicationsTable: dynamodb.Table;
  public readonly sponsorInquiriesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Events table — list and detail pages
    // GSI byDate: lists all events sorted chronologically
    this.eventsTable = new dynamodb.Table(this, 'EventsTable', {
      tableName: 'connect-events',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.eventsTable.addGlobalSecondaryIndex({
      indexName: 'byDate',
      partitionKey: { name: 'entity', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
    });

    // Email signups — newsletter / mailing list form
    this.emailSignupsTable = new dynamodb.Table(this, 'EmailSignupsTable', {
      tableName: 'connect-email-signups',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.emailSignupsTable.addGlobalSecondaryIndex({
      indexName: 'byStatus',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Vendor applications
    this.vendorApplicationsTable = new dynamodb.Table(this, 'VendorApplicationsTable', {
      tableName: 'connect-vendor-applications',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.vendorApplicationsTable.addGlobalSecondaryIndex({
      indexName: 'byStatus',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Volunteer applications
    this.volunteerApplicationsTable = new dynamodb.Table(this, 'VolunteerApplicationsTable', {
      tableName: 'connect-volunteer-applications',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.volunteerApplicationsTable.addGlobalSecondaryIndex({
      indexName: 'byStatus',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Artist applications
    this.artistApplicationsTable = new dynamodb.Table(this, 'ArtistApplicationsTable', {
      tableName: 'connect-artist-applications',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.artistApplicationsTable.addGlobalSecondaryIndex({
      indexName: 'byStatus',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Sponsor inquiries
    this.sponsorInquiriesTable = new dynamodb.Table(this, 'SponsorInquiriesTable', {
      tableName: 'connect-sponsor-inquiries',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.sponsorInquiriesTable.addGlobalSecondaryIndex({
      indexName: 'byStatus',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Outputs — table names referenced by BackendStack Lambda env vars
    new cdk.CfnOutput(this, 'EventsTableName', { value: this.eventsTable.tableName });
    new cdk.CfnOutput(this, 'EmailSignupsTableName', { value: this.emailSignupsTable.tableName });
    new cdk.CfnOutput(this, 'VendorApplicationsTableName', { value: this.vendorApplicationsTable.tableName });
    new cdk.CfnOutput(this, 'VolunteerApplicationsTableName', { value: this.volunteerApplicationsTable.tableName });
    new cdk.CfnOutput(this, 'ArtistApplicationsTableName', { value: this.artistApplicationsTable.tableName });
    new cdk.CfnOutput(this, 'SponsorInquiriesTableName', { value: this.sponsorInquiriesTable.tableName });
  }
}
