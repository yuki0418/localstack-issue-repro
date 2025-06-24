import * as cdk from "aws-cdk-lib";

export type StageConfig = {
  env: cdk.StackProps["env"];
};

export const stageConfig: Record<"test", StageConfig> = {
  test: {
    env: {
      account: "000000000000",
      region: "us-west-2",
    },
  },
};

export type StageName = keyof typeof stageConfig;
