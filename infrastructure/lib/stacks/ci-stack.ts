import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CiStack extends cdk.Stack {
  public readonly deployRoleArn: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // OIDC provider — one per account, lets GitHub Actions exchange tokens for AWS creds
    const oidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    // IAM role assumed by GitHub Actions — scoped to this repo only
    const deployRole = new iam.Role(this, 'GitHubActionsDeployRole', {
      assumedBy: new iam.WebIdentityPrincipal(oidcProvider.openIdConnectProviderArn, {
        StringLike: {
          'token.actions.githubusercontent.com:sub': 'repo:hsmith100/connect-atlanta:*',
        },
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
      }),
      // AdministratorAccess is scoped by the OIDC trust — only this repo can assume this role
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
      ],
      description: 'Role assumed by GitHub Actions for staging deployments',
    });

    this.deployRoleArn = deployRole.roleArn;

    new cdk.CfnOutput(this, 'DeployRoleArn', {
      value: deployRole.roleArn,
      description: 'Add as AWS_DEPLOY_ROLE_ARN in GitHub repo secrets',
    });
  }
}
