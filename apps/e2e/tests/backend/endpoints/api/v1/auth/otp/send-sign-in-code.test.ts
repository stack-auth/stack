import { it } from "../../../../../../helpers";
import { Auth, Project, backendContext, niceBackendFetch } from "../../../../../backend-helpers";

it("should send a sign-in code per e-mail", async ({ expect }) => {
  await Auth.Otp.sendSignInCode();
  expect(await backendContext.value.mailbox.fetchMessages({ noBody: true })).toMatchInlineSnapshot(`
    [
      MailboxMessage {
        "from": "Stack Dashboard <noreply@example.com>",
        "subject": "Sign in to Stack Dashboard",
        "to": ["<<stripped UUID>@stack-generated.example.com>"],
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
        "error": "Redirect URL not whitelisted. Did you forget to add this domain to the trusted domains list on the Stack Auth dashboard?",
      },
      "headers": Headers {
        "x-stack-known-error": "REDIRECT_URL_NOT_WHITELISTED",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should refuse to sign up a new user if magic links are disabled on the project", async ({ expect }) => {
  await Project.createAndSwitch({ config: { magic_link_enabled: false } });
  const mailbox = backendContext.value.mailbox;
  const response = await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      callback_url: "http://localhost:12345/some-callback-url",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 403,
      "body": "Magic link is not enabled for this project",
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should refuse to sign up a new user if sign ups are disabled on the project", async ({ expect }) => {
  await Project.createAndSwitch({ config: { sign_up_enabled: false, credential_enabled: false, magic_link_enabled: true } });
  const mailbox = backendContext.value.mailbox;
  const response = await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      callback_url: "http://localhost:12345/some-callback-url",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "SIGN_UP_NOT_ENABLED",
        "error": "Creation of new accounts is not enabled for this project. Please ask the project owner to enable it.",
      },
      "headers": Headers {
        "x-stack-known-error": "SIGN_UP_NOT_ENABLED",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should send otp code to user", async ({ expect }) => {
  await Auth.Otp.sendSignInCode();
  const mailbox = backendContext.value.mailbox;
  await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      callback_url: "http://localhost:12345/some-callback-url",
    },
  });

  const email = (await backendContext.value.mailbox.fetchMessages()).findLast((email) => email.subject.includes("Sign in"));
  const match = email?.body?.text.match(/^[A-Z0-9]{6}$/sm);
  expect(match).toHaveLength(1);
  const code = match?.[0];
  expect(code).toHaveLength(6);
});

it("should not send otp code to user if client version is older equal to 2.5.37", async ({ expect }) => {
  await Auth.Otp.sendSignInCode();
  const mailbox = backendContext.value.mailbox;
  await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      callback_url: "http://localhost:12345/some-callback-url",
    },
    headers: {
      "X-Stack-Client-Version": "js @stackframe/stack@2.5.37",
    },
  });

  const email = (await backendContext.value.mailbox.fetchMessages()).findLast((email) => email.subject.includes("Sign in"));
  const match = email?.body?.text.match(/^[A-Z0-9]{6}$/sm);
  expect(match).toBeNull();
});

it.todo("should create a team for newly created users if configured as such");

it.todo("should not create a team for newly created users if not configured as such");

