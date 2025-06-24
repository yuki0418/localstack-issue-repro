import * as cdk from "aws-cdk-lib";
import { stageConfig } from "./config";
import { ApiStack } from "./api/api-stack";

class App extends cdk.App {
  constructor(props?: cdk.AppProps) {
    super(props);

    const config = stageConfig["test"];
    const stage = "test";

    new ApiStack(this, `LocalStackCognitoRepro-${stage}-ApiStack`, {
      ...config,
    });
  }
}

new App();
