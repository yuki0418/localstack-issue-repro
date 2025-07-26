import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  UpdateUserAttributesCommand,
  type UpdateUserAttributesCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";

interface ChangeEmailRequest {
  email: string;
}

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Change email handler started");
  console.log("Event:", JSON.stringify(event, null, 2));
  console.log("Environment variables:", {
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    AWS_REGION: process.env.AWS_REGION,
  });

  const accessToken = event.headers["authorization"]?.split(" ")[1];
  if (!accessToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized: No access token provided",
      }),
    };
  }

  if (!event.body) {
    console.log("No request body provided");
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Request body is required" }),
    };
  }

  const request: ChangeEmailRequest = JSON.parse(event.body);

  const updateCommand = new UpdateUserAttributesCommand({
    AccessToken: accessToken,
    UserAttributes: [{ Name: "email", Value: request.email }],
  });

  let result: UpdateUserAttributesCommandOutput = await cognitoClient.send(
    updateCommand
  );

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      result,
    }),
  };
};
