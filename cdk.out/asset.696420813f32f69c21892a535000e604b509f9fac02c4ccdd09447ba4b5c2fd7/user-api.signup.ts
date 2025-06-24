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
  console.log("Signup handler started");
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
    const { email, password, firstName, lastName }: SignupRequest = JSON.parse(
      event.body
    );
    console.log("Parsed request:", { email, firstName, lastName });

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

    console.log("Creating SignUpCommand with:", {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      UserAttributes: userAttributes,
    });

    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      Password: password,
      UserAttributes: userAttributes,
    });

    console.log("Sending SignUpCommand to Cognito");
    const response = await cognitoClient.send(command);
    console.log("Cognito response:", response);

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
    console.error("Error stack:", error.stack);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Signup failed",
        error: error.name || "UnknownError",
      }),
    };
  }
};
