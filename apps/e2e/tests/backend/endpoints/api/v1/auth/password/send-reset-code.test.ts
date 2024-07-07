import { it, localRedirectUrl } from "../../../../../../helpers";
import { backendContext, Auth, niceBackendFetch } from "../../../../../backend-helpers";

it("should send a password reset code per e-mail", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  await Auth.signOut();
  const mailbox = backendContext.value.mailbox;
  const response = await niceBackendFetch("/api/v1/auth/password/send-reset-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      callback_url: localRedirectUrl,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
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
        "subject": "Reset your password at Stack Dashboard",
        "to": ["<<stripped UUID>@stack-generated.example.com>"],
        <some fields may have been hidden>,
      },
    ]
  `);
});

it("should not send a password reset code to an e-mail that hasn't signed up", async ({ expect }) => {
  const mailbox = backendContext.value.mailbox;
  const response = await niceBackendFetch("/api/v1/auth/password/send-reset-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      callback_url: localRedirectUrl,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "EMAIL_NOT_ASSOCIATED_WITH_USER",
        "error": "The e-mail is not associated with a user that could log in with that e-mail.",
      },
      "headers": Headers {
        "x-stack-known-error": "EMAIL_NOT_ASSOCIATED_WITH_USER",
        <some fields may have been hidden>,
      },
    }
  `);
  expect(await backendContext.value.mailbox.fetchMessages({ noBody: true })).toMatchInlineSnapshot(`[]`);
});

it("should send a password reset code even if the user signed up with magic link", async ({ expect }) => {
  await Auth.Otp.signIn();
  await Auth.signOut();
  const mailbox = backendContext.value.mailbox;
  const response = await niceBackendFetch("/api/v1/auth/password/send-reset-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      callback_url: localRedirectUrl,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it('should not send a password reset code if the redirect URL is invalid', async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  await Auth.signOut();
  const mailbox = backendContext.value.mailbox;
  const response = await niceBackendFetch("/api/v1/auth/password/send-reset-code", {
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
        <some fields may have been hidden>,
      },
    }
  `);
});

it.todo("should not send a password reset code if the project does not have password authentication enabled");

it.todo("should not send a password reset code if the user does not have e-mail authentication enabled");
