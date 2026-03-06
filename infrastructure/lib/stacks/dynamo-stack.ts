import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoStackProps extends cdk.StackProps {
  // 'staging-' for staging, '' (default) for prod.
  // Prod tables were deployed without a prefix so we keep them as-is.
  tablePrefix?: string;
}

export class DynamoStack extends cdk.Stack {
  public readonly eventsTable: dynamodb.Table;
  public readonly emailSignupsTable: dynamodb.Table;
  public readonly artistApplicationsTable: dynamodb.Table;
  public readonly sponsorInquiriesTable: dynamodb.Table;
  public readonly photosTable: dynamodb.Table;
  public readonly heroCardsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoStackProps = {}) {
    super(scope, id, props);
    const p = props.tablePrefix ?? '';

    // Events table — list and detail pages
    // GSI byDate: lists all events sorted chronologically
    this.eventsTable = new dynamodb.Table(this, 'EventsTable', {
      tableName: `connect-${p}events`,
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
      tableName: `connect-${p}email-signups`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.emailSignupsTable.addGlobalSecondaryIndex({
      indexName: 'byStatus',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Artist applications
    this.artistApplicationsTable = new dynamodb.Table(this, 'ArtistApplicationsTable', {
      tableName: `connect-${p}artist-applications`,
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
      tableName: `connect-${p}sponsor-inquiries`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.sponsorInquiriesTable.addGlobalSecondaryIndex({
      indexName: 'byStatus',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Photos — curated gallery with sort order and visibility
    // GSI byOrder: lists all photos sorted by sortOrder for gallery display
    this.photosTable = new dynamodb.Table(this, 'PhotosTable', {
      tableName: `connect-${p}photos`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.photosTable.addGlobalSecondaryIndex({
      indexName: 'byOrder',
      partitionKey: { name: 'entity', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sortOrder', type: dynamodb.AttributeType.NUMBER },
    });

    // Hero cards — admin-managed home page hero cards with sort order and visibility
    // GSI byOrder: lists all cards sorted by sortOrder for home page display
    this.heroCardsTable = new dynamodb.Table(this, 'HeroCardsTable', {
      tableName: `connect-${p}hero-cards`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.heroCardsTable.addGlobalSecondaryIndex({
      indexName: 'byOrder',
      partitionKey: { name: 'entity', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sortOrder', type: dynamodb.AttributeType.NUMBER },
    });

    // Outputs — table names referenced by BackendStack Lambda env vars
    new cdk.CfnOutput(this, 'EventsTableName', { value: this.eventsTable.tableName });
    new cdk.CfnOutput(this, 'EmailSignupsTableName', { value: this.emailSignupsTable.tableName });
    new cdk.CfnOutput(this, 'ArtistApplicationsTableName', { value: this.artistApplicationsTable.tableName });
    new cdk.CfnOutput(this, 'SponsorInquiriesTableName', { value: this.sponsorInquiriesTable.tableName });
    new cdk.CfnOutput(this, 'PhotosTableName', { value: this.photosTable.tableName });
    new cdk.CfnOutput(this, 'HeroCardsTableName', { value: this.heroCardsTable.tableName });
  }
}
