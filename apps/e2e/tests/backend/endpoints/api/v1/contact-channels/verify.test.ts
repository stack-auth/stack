import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { it } from "../../../../../helpers";
import { Auth, ContactChannels, backendContext, niceBackendFetch } from "../../../../backend-helpers";

it("should verify user's email", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  const userResponse1 = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
  expect(userResponse1.body.primary_email_verified).toBe(false);
  await ContactChannels.verify();
  const userResponse2 = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
  expect(userResponse2.body.primary_email_verified).toBe(true);
});

it("each verification code that was already requested can be used exactly once", async ({ expect }) => {
  // note: send-verification-code checks that you didn't already verify the email when you send the verification code, but if you request multiple at the same time you should be able to use them all
  await Auth.Password.signUpWithEmail();
  await ContactChannels.sendVerificationCode();
  await ContactChannels.sendVerificationCode();
  const mailbox = backendContext.value.mailbox;
  const messages = await mailbox.fetchMessages();
  const verifyMessages = messages.filter((message) => message.subject === "Verify your email at Stack Dashboard");
  const verificationCodes = verifyMessages.map(
    (message) =>
      message.body?.text.match(/http:\/\/localhost:12345\/some-callback-url\?code=([a-zA-Z0-9]+)/)?.[1] ??
      throwErr("Verification code not found"),
  );
  expect(verificationCodes).toHaveLength(3);

  for (const code of verificationCodes) {
    const response1 = await niceBackendFetch("/api/v1/contact-channels/verify", {
      method: "POST",
      accessType: "client",
      body: {
        code,
      },
    });
    expect(response1).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": { "success": true },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
    const response2 = await niceBackendFetch("/api/v1/contact-channels/verify", {
      method: "POST",
      accessType: "client",
      body: {
        code,
      },
    });
    expect(response2).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": {
          "code": "VERIFICATION_CODE_ALREADY_USED",
          "error": "The verification link has already been used.",
        },
        "headers": Headers {
          "x-stack-known-error": "VERIFICATION_CODE_ALREADY_USED",
          <some fields may have been hidden>,
        },
      }
    `);
  }
});
