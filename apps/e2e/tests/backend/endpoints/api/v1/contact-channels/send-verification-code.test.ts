import { it } from "../../../../../helpers";
import { Auth, backendContext, niceBackendFetch } from "../../../../backend-helpers";
import { ContactChannels } from "../../../../backend-helpers";

it("can't send a verification code while logged out", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  backendContext.set({ userAuth: null });
  const response = await niceBackendFetch("/api/v1/contact-channels/send-verification-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: backendContext.value.mailbox.emailAddress,
      callback_url: "http://localhost:12345",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "SCHEMA_ERROR",
        "details": { "message": "Request validation failed on POST /api/v1/contact-channels/send-verification-code:\\n  - auth.user is a required field" },
        "error": "Request validation failed on POST /api/v1/contact-channels/send-verification-code:\\n  - auth.user is a required field",
      },
      "headers": Headers {
        "x-stack-known-error": "SCHEMA_ERROR",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should send a verification code per e-mail", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  await ContactChannels.sendVerificationCode();
  expect(await backendContext.value.mailbox.fetchMessages({ noBody: true })).toMatchInlineSnapshot(`
    [
      MailboxMessage {
        "from": "Stack Dashboard <noreply@example.com>",
        "subject": "Verify your email at Stack Dashboard",
        "to": ["<<stripped UUID>@stack-generated.example.com>"],
        <some fields may have been hidden>,
      },
      MailboxMessage {
        "from": "Stack Dashboard <noreply@example.com>",
        "subject": "Verify your email at Stack Dashboard",
        "to": ["<<stripped UUID>@stack-generated.example.com>"],
        <some fields may have been hidden>,
      },
    ]
  `);
});

it("can't verify an e-mail that has already been verified", async ({ expect }) => {
  await Auth.Otp.signIn(); // OTP accounts are verified by default
  const response = await niceBackendFetch("/api/v1/contact-channels/send-verification-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: backendContext.value.mailbox.emailAddress,
      callback_url: "http://localhost:12345",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "EMAIL_ALREADY_VERIFIED",
        "error": "The e-mail is already verified.",
      },
      "headers": Headers {
        "x-stack-known-error": "EMAIL_ALREADY_VERIFIED",
        <some fields may have been hidden>,
      },
    }
  `);
});
