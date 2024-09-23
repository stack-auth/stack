import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { it } from "../../../../../../helpers";
import { Auth, Project, backendContext, niceBackendFetch } from "../../../../../backend-helpers";

it("should sign up new users and sign in existing users", async ({ expect }) => {
  const res1 = await Auth.Otp.signIn();
  expect(res1.signInResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "access_token": <stripped field 'access_token'>,
        "is_new_user": true,
        "refresh_token": <stripped field 'refresh_token'>,
        "user_id": "<stripped UUID>",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
  const res2 = await Auth.Otp.signIn();
  expect(res2.signInResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "access_token": <stripped field 'access_token'>,
        "is_new_user": false,
        "refresh_token": <stripped field 'refresh_token'>,
        "user_id": "<stripped UUID>",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should sign in users created with the server API", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/users", {
    accessType: "server",
    method: "POST",
    body: {
      primary_email: backendContext.value.mailbox.emailAddress,
      primary_email_auth_enabled: true,
    },
  });
  expect(response.status).toBe(201);
  const res2 = await Auth.Otp.signIn();
  expect(res2.signInResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "access_token": <stripped field 'access_token'>,
        "is_new_user": false,
        "refresh_token": <stripped field 'refresh_token'>,
        "user_id": "<stripped UUID>",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should sign in users created with the server API even if sign up is disabled", async ({ expect }) => {
  await Project.createAndSwitch({ config: { sign_up_enabled: false, magic_link_enabled: true } });
  const response = await niceBackendFetch("/api/v1/users", {
    accessType: "server",
    method: "POST",
    body: {
      primary_email: backendContext.value.mailbox.emailAddress,
      primary_email_auth_enabled: true,
    },
  });
  expect(response.status).toBe(201);
  const res2 = await Auth.Otp.signIn();
  expect(res2.signInResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "access_token": <stripped field 'access_token'>,
        "is_new_user": false,
        "refresh_token": <stripped field 'refresh_token'>,
        "user_id": "<stripped UUID>",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should sign up a new user even if one already exists with email auth disabled", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/users", {
    accessType: "server",
    method: "POST",
    body: {
      primary_email: backendContext.value.mailbox.emailAddress,
      primary_email_auth_enabled: false,
    },
  });
  const res2 = await Auth.Otp.signIn();
  expect(res2.signInResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "access_token": <stripped field 'access_token'>,
        "is_new_user": true,
        "refresh_token": <stripped field 'refresh_token'>,
        "user_id": "<stripped UUID>",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should not allow signing in when MFA is required", async ({ expect }) => {
  const res = await Auth.Otp.signIn();
  await Auth.Mfa.setupTotpMfa();
  await Auth.signOut();

  const mailbox = backendContext.value.mailbox;
  await Auth.Otp.sendSignInCode();
  const messages = await mailbox.fetchMessages();
  const message = messages.findLast((message) => message.subject.includes("Sign in to")) ?? throwErr("Sign-in code message not found");
  const signInCode = message.body?.text.match(/http:\/\/localhost:12345\/some-callback-url\?code=([a-zA-Z0-9]+)/)?.[1] ?? throwErr("Sign-in URL not found");
  const response = await niceBackendFetch("/api/v1/auth/otp/sign-in", {
    method: "POST",
    accessType: "client",
    body: {
      code: signInCode,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "MULTI_FACTOR_AUTHENTICATION_REQUIRED",
        "details": { "attempt_code": <stripped field 'attempt_code'> },
        "error": "Multi-factor authentication is required for this user.",
      },
      "headers": Headers {
        "x-stack-known-error": "MULTI_FACTOR_AUTHENTICATION_REQUIRED",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should sign in with otp code", async ({ expect }) => {
  await Auth.Otp.sendSignInCode();
  const mailbox = backendContext.value.mailbox;
  const sendSignInCodeResponse = await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      callback_url: "http://localhost:12345/some-callback-url",
    },
  });

  expect(sendSignInCodeResponse.status).toBe(200);
  expect(sendSignInCodeResponse.body.nonce).toBeDefined();

  const email = (await backendContext.value.mailbox.fetchMessages()).findLast((message) => message.subject.includes("Sign in to")) ?? throwErr("Sign-in code message not found");
  const match = email.body?.text.match(/^[A-Z0-9]{6}$/sm);

  const signInResponse = await niceBackendFetch("/api/v1/auth/otp/sign-in", {
    method: "POST",
    accessType: "client",
    body: {
      code: match?.[0] + sendSignInCodeResponse.body.nonce,
    },
  });

  expect(signInResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "access_token": <stripped field 'access_token'>,
        "is_new_user": false,
        "refresh_token": <stripped field 'refresh_token'>,
        "user_id": "<stripped UUID>",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should not sign in if code is invalid", async ({ expect }) => {
  await Auth.Otp.sendSignInCode();
  const mailbox = backendContext.value.mailbox;
  const sendSignInCodeResponse = await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      callback_url: "http://localhost:12345/some-callback-url",
    },
  });

  const signInResponse = await niceBackendFetch("/api/v1/auth/otp/sign-in", {
    method: "POST",
    accessType: "client",
    body: {
      code: 'ABC123' + sendSignInCodeResponse.body.nonce,
    },
  });

  expect(signInResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 404,
      "body": {
        "code": "VERIFICATION_CODE_NOT_FOUND",
        "error": "The verification code does not exist for this project.",
      },
      "headers": Headers {
        "x-stack-known-error": "VERIFICATION_CODE_NOT_FOUND",
        <some fields may have been hidden>,
      },
    }
  `);
});


it("should set the code to invalid after too many attempts", async ({ expect }) => {
  await Auth.Otp.sendSignInCode();
  const mailbox = backendContext.value.mailbox;
  const sendSignInCodeResponse = await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: mailbox.emailAddress,
      callback_url: "http://localhost:12345/some-callback-url",
    },
  });

  const email = (await backendContext.value.mailbox.fetchMessages()).findLast((message) => message.subject.includes("Sign in to")) ?? throwErr("Sign-in code message not found");
  const match = email.body?.text.match(/^[A-Z0-9]{6}$/sm);

  for (let i = 0; i < 25; i++) {
    await niceBackendFetch("/api/v1/auth/otp/sign-in", {
      method: "POST",
      accessType: "client",
      body: {
        code: 'ABC123' + sendSignInCodeResponse.body.nonce,
      },
    });
  }

  const signInResponse = await niceBackendFetch("/api/v1/auth/otp/sign-in", {
    method: "POST",
    accessType: "client",
    body: {
      code: match?.[0] + sendSignInCodeResponse.body.nonce,
    },
  });

  expect(signInResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "VERIFICATION_CODE_MAX_ATTEMPTS_REACHED",
        "error": "The verification code nonce has reached the maximum number of attempts. This code is not valid anymore.",
      },
      "headers": Headers {
        "x-stack-known-error": "VERIFICATION_CODE_MAX_ATTEMPTS_REACHED",
        <some fields may have been hidden>,
      },
    }
  `);
});


it.todo("should not sign in if primary e-mail changed since sign-in code was sent");

it.todo("should verify primary e-mail");
