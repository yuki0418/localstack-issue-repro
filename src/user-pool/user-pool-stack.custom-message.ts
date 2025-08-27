import { type Context, type CustomMessageTriggerEvent } from "aws-lambda";

export async function handler(
  event: CustomMessageTriggerEvent,
  _context: Context
): Promise<CustomMessageTriggerEvent> {
  console.error(`🚀 CustomMessage event: ${event.triggerSource}`, {
    userAttributes: event.request,
  });

  if (
    event.triggerSource === "CustomMessage_ForgotPassword" &&
    !event.request.userAttributes
  ) {
    console.error(`🚀🚀 CustomMessage event: ${event.triggerSource}`, {
      userAttributes: event.request,
    });
    throw new Error("userAttributes is required for forgot password");
  }

  event.response.emailSubject = "Dummy subject";
  event.response.emailMessage += `<p>Dummy message</p>`;

  return event;
}
