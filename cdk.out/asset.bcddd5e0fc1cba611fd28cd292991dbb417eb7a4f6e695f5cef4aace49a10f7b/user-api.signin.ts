import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
  InitiateAuthCommand,
  type GetUserCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

interface SigninRequest {
  email: string;
  password: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Request body is required" }),
      };
    }

    const { email, password }: SigninRequest = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email and password are required" }),
      };
    }

    // Initiate authentication
    const authCommand = new InitiateAuthCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const authResponse = await cognitoClient.send(authCommand);

    if (!authResponse.AuthenticationResult?.AccessToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Authentication failed" }),
      };
    }

    // Get user details
    const getUserCommand = new GetUserCommand({
      AccessToken: authResponse.AuthenticationResult.AccessToken,
    });

    const userResponse: GetUserCommandOutput = await cognitoClient.send(
      getUserCommand
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Signin successful",
        user: userResponse,
        tokens: {
          accessToken: authResponse.AuthenticationResult.AccessToken,
          refreshToken: authResponse.AuthenticationResult.RefreshToken,
          idToken: authResponse.AuthenticationResult.IdToken,
        },
      }),
    };
  } catch (error: any) {
    console.error("Signin error:", error);

    return {
      statusCode: 401,
      body: JSON.stringify({
        message: error.message || "Signin failed",
      }),
    };
  }
};
