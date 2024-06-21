import { createMailbox, it } from "../../../../../../helpers";
import { niceBackendFetch } from "../../../../../backend-helpers";

it("should send a sign-in code per e-mail", async ({ expect }) => {
  const mailbox = createMailbox();
  const response = await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
    method: "POST",
    internalProject: true,
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      redirectUrl: "http://localhost:12345",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers {
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some fields may have been hidden>,
      },
    }
  `);
  expect(await mailbox.fetchMessages({ subjectOnly: true })).toMatchInlineSnapshot(`
    [
      MailboxMessage {
        "subject": "Sign in to Stack Dashboard",
        <some fields may have been hidden>,
      },
    ]
  `);
});
