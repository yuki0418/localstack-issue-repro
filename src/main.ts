import * as cdk from "aws-cdk-lib";
import { stageConfig } from "./config";
import { ApiStack } from "./api/api-stack";
import { UserPoolStack } from "./user-pool/user-pool-stack";

class App extends cdk.App {
  constructor(props?: cdk.AppProps) {
    super(props);

    const config = stageConfig["test"];

    const userPoolStack = new UserPoolStack(this, "UserPoolStack", {
      stackName: "test-user-pool-stack",
      ...config,
    });

    new ApiStack(this, `ApiStack`, {
      userPool: userPoolStack.userPool,
      userPoolClient: userPoolStack.userPoolClient,
      stackName: "test-api-stack",
      ...config,
    });
  }
}

new App();
