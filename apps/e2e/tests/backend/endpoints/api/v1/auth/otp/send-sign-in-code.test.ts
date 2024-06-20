import { createMailbox, it } from "../../../../../../helpers";
import { niceBackendFetch } from "../../../../../backend-helpers";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";

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
  console.log(response.headers);
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers {
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some headers may have been hidden>,
      },
    }
  `);
  expect(await mailbox.fetchMessages()).toMatchInlineSnapshot(`
    [
      MailboxMessage {
        "date": <stripped field 'date'>,
        "from": "Stack Dashboard <noreply@example.com>",
        "id": <stripped field 'id'>,
        "mailbox": <stripped field 'mailbox'>,
        "posix-millis": <stripped field 'posix-millis'>,
        "seen": false,
        "size": 10576,
        "subject": "Sign in to Stack Dashboard",
        "to": <stripped field 'to'>,
      },
    ]
  `);
});
