import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { it } from "../../../../../../helpers";
import { Auth, Project, backendContext, niceBackendFetch } from "../../../../../backend-helpers";

it("should sign up new users", async ({ expect }) => {
  const res = await Auth.Password.signUpWithEmail();
  expect(res.signUpResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "access_token": <stripped field 'access_token'>,
        "refresh_token": <stripped field 'refresh_token'>,
        "user_id": "<stripped UUID>",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
  const messages = await backendContext.value.mailbox.fetchMessages({ noBody: true });
  expect(messages).toMatchInlineSnapshot(`
    [
      MailboxMessage {
        "from": "Stack Dashboard <noreply@example.com>",
        "subject": "Verify your email at Stack Dashboard",
        "to": ["<<stripped UUID>@stack-generated.example.com>"],
        <some fields may have been hidden>,
      },
    ]
  `);
  const response = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "auth_with_email": true,
        "client_metadata": null,
        "client_read_only_metadata": null,
        "display_name": null,
        "has_password": true,
        "id": "<stripped UUID>",
        "oauth_providers": [],
        "otp_auth_enabled": false,
        "primary_email": "<stripped UUID>@stack-generated.example.com",
        "primary_email_verified": false,
        "profile_image_url": null,
        "requires_totp_mfa": false,
        "selected_team": null,
        "selected_team_id": null,
        "signed_up_at_millis": <stripped field 'signed_up_at_millis'>,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should not allow signing up with an e-mail that already exists", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  const res2 = await niceBackendFetch("/api/v1/auth/password/sign-up", {
    method: "POST",
    accessType: "client",
    body: {
      email: backendContext.value.mailbox.emailAddress,
      password: generateSecureRandomString(),
      verification_callback_url: "http://localhost:12345",
    },
  });
  expect(res2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "USER_EMAIL_ALREADY_EXISTS",
        "error": "User already exists.",
      },
      "headers": Headers {
        "x-stack-known-error": "USER_EMAIL_ALREADY_EXISTS",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should not allow signing up if credentials are disabled", async ({ expect }) => {
  await Project.createAndSwitch({ config: { credential_enabled: false } });
  const res2 = await niceBackendFetch("/api/v1/auth/password/sign-up", {
    method: "POST",
    accessType: "client",
    body: {
      email: backendContext.value.mailbox.emailAddress,
      password: generateSecureRandomString(),
      verification_callback_url: "http://localhost:12345",
    },
  });
  expect(res2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "PASSWORD_AUTHENTICATION_NOT_ENABLED",
        "error": "Password authentication is not enabled for this project.",
      },
      "headers": Headers {
        "x-stack-known-error": "PASSWORD_AUTHENTICATION_NOT_ENABLED",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should not allow signing up if sign ups are disabled", async ({ expect }) => {
  await Project.createAndSwitch({ config: { sign_up_enabled: false, credential_enabled: true } });
  const res2 = await niceBackendFetch("/api/v1/auth/password/sign-up", {
    method: "POST",
    accessType: "client",
    body: {
      email: backendContext.value.mailbox.emailAddress,
      password: generateSecureRandomString(),
      verification_callback_url: "http://localhost:12345",
    },
  });
  expect(res2).toMatchInlineSnapshot(`
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

it("cannot use empty password to sign up", async ({ expect }) => {
  const res = await niceBackendFetch("/api/v1/auth/password/sign-up", {
    method: "POST",
    accessType: "client",
    body: {
      email: backendContext.value.mailbox.emailAddress,
      password: "",
      verification_callback_url: "http://localhost:12345",
    },
  });
  expect(res).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "SCHEMA_ERROR",
        "details": { "message": "Request validation failed on POST /api/v1/auth/password/sign-up:\\n  - body.password is a required field" },
        "error": "Request validation failed on POST /api/v1/auth/password/sign-up:\\n  - body.password is a required field",
      },
      "headers": Headers {
        "x-stack-known-error": "SCHEMA_ERROR",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("cannot use a password that is too short to sign up", async ({ expect }) => {
  const res = await niceBackendFetch("/api/v1/auth/password/sign-up", {
    method: "POST",
    accessType: "client",
    body: {
      email: backendContext.value.mailbox.emailAddress,
      password: "short",
      verification_callback_url: "http://localhost:12345",
    },
  });
  expect(res).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "PASSWORD_TOO_SHORT",
        "details": { "min_length": 8 },
        "error": "Password too short. Minimum length is 8.",
      },
      "headers": Headers {
        "x-stack-known-error": "PASSWORD_TOO_SHORT",
        <some fields may have been hidden>,
      },
    }
  `);
});

it.todo("should create a team for newly created users if configured as such");

it.todo("should not create a team for newly created users if not configured as such");
