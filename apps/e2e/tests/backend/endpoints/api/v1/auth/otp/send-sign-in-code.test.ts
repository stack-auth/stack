import { it } from "../../../../../../helpers";
import { backendContext, Auth, niceBackendFetch } from "../../../../../backend-helpers";

it("should send a sign-in code per e-mail", async ({ expect }) => {
  await Auth.Otp.sendSignInCode();
  expect(await backendContext.value.mailbox.fetchMessages({ subjectOnly: true })).toMatchInlineSnapshot(`
    [
      MailboxMessage {
        "subject": "Sign in to Stack Dashboard",
        <some fields may have been hidden>,
      },
    ]
  `);
});

it('should refuse to send a sign-in code if the redirect URL is invalid', async ({ expect }) => {
  const mailbox = backendContext.value.mailbox;
  const response = await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      callback_url: "http://evil-website.example.com",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "REDIRECT_URL_NOT_WHITELISTED",
        "error": "Redirect URL not whitelisted.",
      },
      "headers": Headers {
        "x-stack-known-error": "REDIRECT_URL_NOT_WHITELISTED",
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some fields may have been hidden>,
      },
    }
  `);
});

it.todo("should create a team for newly created users if configured as such");

it.todo("should not create a team for newly created users if not configured as such");

