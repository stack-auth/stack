import { it } from "../../../../../../helpers";
import { Auth, backendContext, niceBackendFetch } from "../../../../../backend-helpers";

it("should allow signing in to existing accounts", async ({ expect }) => {
  const res = await Auth.Password.signUpWithEmail();
  backendContext.set({ userAuth: null });
  await Auth.expectToBeSignedOut();
  const res2 = await Auth.Password.signInWithEmail({ password: res.password });
  expect(res2.signInResponse).toMatchInlineSnapshot(`
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
  const response = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
  expect(response.body.auth_methods).toMatchInlineSnapshot(`
    [
      {
        "identifier": "<stripped UUID>@stack-generated.example.com",
        "type": "password",
      },
      {
        "contact_channel": {
          "email": "<stripped UUID>@stack-generated.example.com",
          "type": "email",
        },
        "type": "otp",
      },
    ]
  `);
});

it("should not allow signing in with an e-mail that never signed up", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/auth/password/sign-in", {
    method: "POST",
    accessType: "client",
    body: {
      email: backendContext.value.mailbox.emailAddress,
      password: "some-password",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "EMAIL_PASSWORD_MISMATCH",
        "error": "Wrong e-mail or password.",
      },
      "headers": Headers {
        "x-stack-known-error": "EMAIL_PASSWORD_MISMATCH",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should not allow signing in with an incorrect password", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  const response = await niceBackendFetch("/api/v1/auth/password/sign-in", {
    method: "POST",
    accessType: "client",
    body: {
      email: backendContext.value.mailbox.emailAddress,
      password: "wrong-password",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "EMAIL_PASSWORD_MISMATCH",
        "error": "Wrong e-mail or password.",
      },
      "headers": Headers {
        "x-stack-known-error": "EMAIL_PASSWORD_MISMATCH",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should not allow signing in when MFA is required", async ({ expect }) => {
  const res = await Auth.Password.signUpWithEmail();
  await Auth.Mfa.setupTotpMfa();
  await Auth.signOut();

  const response = await niceBackendFetch("/api/v1/auth/password/sign-in", {
    method: "POST",
    accessType: "client",
    body: {
      email: backendContext.value.mailbox.emailAddress,
      password: res.password,
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
