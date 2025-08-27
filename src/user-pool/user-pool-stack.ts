import * as cdk from "aws-cdk-lib";
import {
  aws_cognito as cognito,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNodejs,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

import {
  UserPoolClient,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Props extends cdk.StackProps {}

export class UserPoolStack extends cdk.Stack {
  public userPool: cognito.UserPool;
  public userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "test-user-pool",
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      userVerification: {
        emailStyle: VerificationEmailStyle.CODE,
        emailSubject: "Verify your email",
        emailBody: "Your verification code is {####}",
      },
      passwordPolicy: {
        minLength: 8,
        requireDigits: false,
        requireLowercase: false,
        requireSymbols: false,
        requireUppercase: false,
      },
    });

    // UserPoolClient
    this.userPoolClient = new UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // Custom message handler
    const customMessageFn = new lambdaNodejs.NodejsFunction(
      this,
      "custom-message",
      {
        entry: path.join(__dirname, "user-pool-stack.custom-message.ts"),
        environment: {},
        runtime: lambda.Runtime.NODEJS_22_X,
      }
    );
    this.userPool.addTrigger(
      cognito.UserPoolOperation.CUSTOM_MESSAGE,
      customMessageFn
    );

    // Outputs
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "The ID of the Cognito UserPool",
      exportName: `test-UserPool`,
    });
    new cdk.CfnOutput(this, "UserPoolArn", {
      value: this.userPool.userPoolArn,
      description: "The ARN of the Cognito UserPool",
    });
    new cdk.CfnOutput(this, "UserPoolUrl", {
      value: this.userPool.userPoolProviderUrl,
      description: "The Provider of the Cognito UserPool",
    });
    new cdk.CfnOutput(this, "ClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "Client ID for the user pool",
    });
  }
}
