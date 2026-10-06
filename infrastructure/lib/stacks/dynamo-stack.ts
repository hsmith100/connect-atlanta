import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoStackProps extends cdk.StackProps {
  // 'staging-' for staging, '' (default) for prod.
  // Prod tables were deployed without a prefix so we keep them as-is.
  tablePrefix?: string;
  // When true, all tables use DESTROY removal policy (for ephemeral PR environments).
  ephemeral?: boolean;
}

export class DynamoStack extends cdk.Stack {
  public readonly eventsTable: dynamodb.Table;
  public readonly emailSignupsTable: dynamodb.Table;
  public readonly artistApplicationsTable: dynamodb.Table;
  public readonly sponsorInquiriesTable: dynamodb.Table;
  public readonly photosTable: dynamodb.Table;
  public readonly heroCardsTable: dynamodb.Table;
  public readonly storeCollectionsTable: dynamodb.Table;
  public readonly storePhotosTable: dynamodb.Table;
  public readonly storePhotographersTable: dynamodb.Table;
  public readonly storeOrdersTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoStackProps = {}) {
    super(scope, id, props);
    const p = props.tablePrefix ?? '';
    const removalPolicy = props.ephemeral ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN;

    // Events table — list and detail pages
    // GSI byDate: lists all events sorted chronologically
    this.eventsTable = new dynamodb.Table(this, 'EventsTable', {
      tableName: `connect-${p}events`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
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
      removalPolicy,
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
      removalPolicy,
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
      removalPolicy,
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
      removalPolicy,
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
      removalPolicy,
    });
    this.heroCardsTable.addGlobalSecondaryIndex({
      indexName: 'byOrder',
      partitionKey: { name: 'entity', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sortOrder', type: dynamodb.AttributeType.NUMBER },
    });

    // ── Photo store ─────────────────────────────────────────────────────────
    // Collections — one per event; also holds the SETTINGS item (no entity, so not in the GSI)
    // GSI byEventDate: lists collections newest event first
    this.storeCollectionsTable = new dynamodb.Table(this, 'StoreCollectionsTable', {
      tableName: `connect-${p}store-collections`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });
    this.storeCollectionsTable.addGlobalSecondaryIndex({
      indexName: 'byEventDate',
      partitionKey: { name: 'entity', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'eventDate', type: dynamodb.AttributeType.STRING },
    });

    // Store photos — each links a private original to its public watermarked preview
    // GSI byCollection: lists a collection's photos in display order
    this.storePhotosTable = new dynamodb.Table(this, 'StorePhotosTable', {
      tableName: `connect-${p}store-photos`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });
    this.storePhotosTable.addGlobalSecondaryIndex({
      indexName: 'byCollection',
      partitionKey: { name: 'collectionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sortOrder', type: dynamodb.AttributeType.NUMBER },
    });

    // Photographers — small table, listed with Scan
    this.storePhotographersTable = new dynamodb.Table(this, 'StorePhotographersTable', {
      tableName: `connect-${p}store-photographers`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });

    // Orders — pending orders expire via TTL on expiresAt (abandoned checkouts)
    // GSI byCreatedAt: admin orders/earnings (entity is set only once paid)
    // GSI byEmail: buyer re-send of download links
    this.storeOrdersTable = new dynamodb.Table(this, 'StoreOrdersTable', {
      tableName: `connect-${p}store-orders`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expiresAt',
      removalPolicy,
    });
    this.storeOrdersTable.addGlobalSecondaryIndex({
      indexName: 'byCreatedAt',
      partitionKey: { name: 'entity', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });
    this.storeOrdersTable.addGlobalSecondaryIndex({
      indexName: 'byEmail',
      partitionKey: { name: 'buyerEmail', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Outputs — table names referenced by BackendStack Lambda env vars
    new cdk.CfnOutput(this, 'EventsTableName', { value: this.eventsTable.tableName });
    new cdk.CfnOutput(this, 'EmailSignupsTableName', { value: this.emailSignupsTable.tableName });
    new cdk.CfnOutput(this, 'ArtistApplicationsTableName', { value: this.artistApplicationsTable.tableName });
    new cdk.CfnOutput(this, 'SponsorInquiriesTableName', { value: this.sponsorInquiriesTable.tableName });
    new cdk.CfnOutput(this, 'PhotosTableName', { value: this.photosTable.tableName });
    new cdk.CfnOutput(this, 'HeroCardsTableName', { value: this.heroCardsTable.tableName });
    new cdk.CfnOutput(this, 'StoreCollectionsTableName', { value: this.storeCollectionsTable.tableName });
    new cdk.CfnOutput(this, 'StorePhotosTableName', { value: this.storePhotosTable.tableName });
    new cdk.CfnOutput(this, 'StorePhotographersTableName', { value: this.storePhotographersTable.tableName });
    new cdk.CfnOutput(this, 'StoreOrdersTableName', { value: this.storeOrdersTable.tableName });
  }
}
