import { Construct } from "constructs";
import { RestApi, LambdaIntegration, Cors } from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Duration, aws_lambda_nodejs } from "aws-cdk-lib";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface UserApiProps {
  userPool: UserPool;
  userPoolClientId: string;
}

export class UserApi extends Construct {
  public readonly api: RestApi;
  public readonly signinFunction: aws_lambda_nodejs.NodejsFunction;
  public readonly signupFunction: aws_lambda_nodejs.NodejsFunction;
  public readonly confirmFunction: aws_lambda_nodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: UserApiProps) {
    super(scope, id);

    // Create signup lambda function
    this.signupFunction = new aws_lambda_nodejs.NodejsFunction(
      this,
      "SignupFunction",
      {
        entry: path.join(__dirname, "user-api.signup.ts"),
        environment: {
          COGNITO_CLIENT_ID: props.userPoolClientId,
        },
        bundling: {
          externalModules: [],
          forceDockerBundling: false,
        },
        timeout: Duration.seconds(30),
      }
    );

    // Create signin lambda function
    this.signinFunction = new aws_lambda_nodejs.NodejsFunction(
      this,
      "SigninFunction",
      {
        entry: path.join(__dirname, "user-api.signin.ts"),
        environment: {
          COGNITO_CLIENT_ID: props.userPoolClientId,
        },
        bundling: {
          externalModules: [],
          forceDockerBundling: false,
        },
        timeout: Duration.seconds(30),
      }
    );

    // Create confirm lambda function
    this.confirmFunction = new aws_lambda_nodejs.NodejsFunction(
      this,
      "ConfirmFunction",
      {
        entry: path.join(__dirname, "user-api.confirm.ts"),
        environment: {
          COGNITO_CLIENT_ID: props.userPoolClientId,
        },
        bundling: {
          externalModules: [],
          forceDockerBundling: false,
        },
        timeout: Duration.seconds(30),
      }
    );

    // Grant permissions to interact with Cognito
    props.userPool.grant(this.signupFunction, "cognito-idp:SignUp");
    props.userPool.grant(
      this.signinFunction,
      "cognito-idp:InitiateAuth",
      "cognito-idp:GetUser"
    );
    props.userPool.grant(this.confirmFunction, "cognito-idp:ConfirmSignUp");

    // Create API Gateway
    this.api = new RestApi(this, "UserApi", {
      restApiName: "User API",
      description: "API for user authentication operations",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // Create API resources and methods
    const userResource = this.api.root.addResource("user");

    userResource
      .addResource("signup")
      .addMethod("POST", new LambdaIntegration(this.signupFunction));

    userResource
      .addResource("signin")
      .addMethod("POST", new LambdaIntegration(this.signinFunction));

    userResource
      .addResource("confirm")
      .addMethod("POST", new LambdaIntegration(this.confirmFunction));
  }
}
