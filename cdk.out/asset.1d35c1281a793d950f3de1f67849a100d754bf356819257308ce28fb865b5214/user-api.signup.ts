import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

interface SignupRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
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

    const { email, password, firstName, lastName }: SignupRequest = JSON.parse(
      event.body
    );

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email and password are required" }),
      };
    }

    const userAttributes = [
      {
        Name: "email",
        Value: email,
      },
    ];

    if (firstName) {
      userAttributes.push({
        Name: "given_name",
        Value: firstName,
      });
    }

    if (lastName) {
      userAttributes.push({
        Name: "family_name",
        Value: lastName,
      });
    }

    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      Password: password,
      UserAttributes: userAttributes,
    });

    const response = await cognitoClient.send(command);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "User created successfully",
        userSub: response.UserSub,
        codeDeliveryDetails: response.CodeDeliveryDetails,
      }),
    };
  } catch (error: any) {
    console.error("Signup error:", error);

    return {
      statusCode: 400,
      body: JSON.stringify({
        message: error.message || "Signup failed",
      }),
    };
  }
};
