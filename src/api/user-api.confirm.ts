import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

interface ConfirmRequest {
  email: string;
  confirmationCode: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Confirm handler started");
  console.log("Event:", JSON.stringify(event, null, 2));
  console.log("Environment variables:", {
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    AWS_REGION: process.env.AWS_REGION,
  });

  try {
    if (!event.body) {
      console.log("No request body provided");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Request body is required" }),
      };
    }

    console.log("Request body:", event.body);
    const { email, confirmationCode }: ConfirmRequest = JSON.parse(event.body);
    console.log("Parsed request:", { email, confirmationCode: "***" });

    if (!email || !confirmationCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: "Email and confirmation code are required" 
        }),
      };
    }

    console.log("Creating ConfirmSignUpCommand with:", {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
    });

    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    console.log("Sending ConfirmSignUpCommand to Cognito");
    const response = await cognitoClient.send(command);
    console.log("Cognito response:", response);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Email confirmed successfully",
      }),
    };
  } catch (error: any) {
    console.error("Confirm error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.name);
    console.error("Error message:", error.message);

    if (error.name === 'ResourceNotFoundException') {
      console.error("Resource not found - likely User Pool Client ID is invalid:", process.env.COGNITO_CLIENT_ID);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Cognito configuration error - User Pool Client not found",
          error: "ResourceNotFoundException",
        }),
      };
    }

    if (error.name === 'CodeMismatchException') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid confirmation code",
          error: "CodeMismatchException",
        }),
      };
    }

    if (error.name === 'ExpiredCodeException') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Confirmation code has expired",
          error: "ExpiredCodeException",
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Confirmation failed",
        error: error.name || "UnknownError",
      }),
    };
  }
};
