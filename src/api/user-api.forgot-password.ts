import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

interface ForgotPasswordRequest {
  email: string;
}

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    console.log("No request body provided");
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Request body is required" }),
    };
  }

  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!clientId) {
    console.error("COGNITO_CLIENT_ID is not set in environment variables");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }

  const request: ForgotPasswordRequest = JSON.parse(event.body);

  const forgotPasswordCommand = new ForgotPasswordCommand({
    ClientId: clientId,
    Username: request.email,
  });

  try {
    await cognitoClient.send(forgotPasswordCommand);
  } catch (error) {
    console.error("Error forgot password:", error);
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
      message: "Forgot password successfully",
    }),
  };
};
