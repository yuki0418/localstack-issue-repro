import { Construct } from "constructs";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { RestApi, LambdaIntegration, Cors } from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Duration } from "aws-cdk-lib";
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
  public readonly signinFunction: Function;
  public readonly signupFunction: Function;

  constructor(scope: Construct, id: string, props: UserApiProps) {
    super(scope, id);

    // Create signup lambda function
    this.signupFunction = new Function(this, "SignupFunction", {
      runtime: Runtime.NODEJS_22_X,
      handler: "api/user-api.signup",
      code: Code.fromAsset(path.join(__dirname)),
      environment: {
        COGNITO_CLIENT_ID: props.userPoolClientId,
      },
      timeout: Duration.seconds(30),
    });

    // Create signin lambda function
    this.signinFunction = new Function(this, "SigninFunction", {
      runtime: Runtime.NODEJS_22_X,
      handler: "api/user-api.signin",
      code: Code.fromAsset(path.join(__dirname)),
      environment: {
        COGNITO_CLIENT_ID: props.userPoolClientId,
      },
      timeout: Duration.seconds(30),
    });

    // Grant permissions to interact with Cognito
    props.userPool.grant(this.signupFunction, "cognito-idp:SignUp");
    props.userPool.grant(
      this.signinFunction,
      "cognito-idp:InitiateAuth",
      "cognito-idp:GetUser"
    );

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
  }
}
