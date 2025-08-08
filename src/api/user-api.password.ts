import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  ChangePasswordCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

interface ChangeEmailRequest {
  oldPassword: string;
  newPassword: string;
}

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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

  const changePasswordCommand = new ChangePasswordCommand({
    AccessToken: accessToken,
    PreviousPassword: request.oldPassword,
    ProposedPassword: request.newPassword,
  });

  try {
    await cognitoClient.send(changePasswordCommand);
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Password changed successfully",
    }),
  };
};
