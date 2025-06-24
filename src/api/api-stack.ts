import { Stack, type StackProps, CfnOutput, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  UserPool,
  UserPoolClient,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpUserPoolAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { UserApi } from "./user-api";

export class ApiStack extends Stack {
  public readonly userApi: UserApi;
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;
  public readonly httpApi: HttpApi;
  public readonly authorizer: HttpUserPoolAuthorizer;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool
    this.userPool = new UserPool(this, "UserPool", {
      userPoolName: "localstack-cognito-repro-user-pool",
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
    });

    // Create User Pool Client
    this.userPoolClient = new UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      userPoolClientName: "localstack-cognito-repro-client",
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    // Create UserApi construct
    this.userApi = new UserApi(this, "UserApi", {
      userPool: this.userPool,
      userPoolClientId: this.userPoolClient.userPoolClientId,
    });

    // Create HTTP API Gateway V2
    this.httpApi = new HttpApi(this, "HttpApi", {
      apiName: "localstack-cognito-repro-api",
      description: "HTTP API for user authentication with Cognito",
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.DELETE,
        ],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    Tags.of(this.httpApi).add("_custom_id_", "test");

    // Create Cognito User Pool Authorizer
    this.authorizer = new HttpUserPoolAuthorizer(
      "UserPoolAuthorizer",
      this.userPool,
      {
        userPoolClients: [this.userPoolClient],
      }
    );

    // Add routes with Lambda integrations
    this.httpApi.addRoutes({
      path: "/user/signup",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "SignupIntegration",
        this.userApi.signupFunction
      ),
    });

    this.httpApi.addRoutes({
      path: "/user/signin",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "SigninIntegration",
        this.userApi.signinFunction
      ),
    });

    this.httpApi.addRoutes({
      path: "/user/confirm",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "ConfirmIntegration",
        this.userApi.confirmFunction
      ),
    });

    // Stack outputs
    new CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "Cognito User Pool ID",
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });

    new CfnOutput(this, "ApiEndpoint", {
      value: this.userApi.api.url,
      description: "API Gateway endpoint URL",
    });

    new CfnOutput(this, "HttpApiEndpoint", {
      value: this.httpApi.url!,
      description: "HTTP API Gateway V2 endpoint URL",
    });
  }
}
