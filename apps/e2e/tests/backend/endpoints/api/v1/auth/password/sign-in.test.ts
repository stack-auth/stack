import { it } from "../../../../../../helpers";
import { Auth, backendContext, niceBackendFetch } from "../../../../../backend-helpers";

it("should allow signing in to existing accounts", async ({ expect }) => {
  const res = await Auth.Password.signUpWithEmail();
  backendContext.value.userAuth = null;
  const currentUserResponse1 = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
  expect(currentUserResponse1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "CANNOT_GET_OWN_USER_WITHOUT_USER",
        "error": "You have specified 'me' as a userId, but did not provide authentication for a user.",
      },
      "headers": Headers {
        "x-stack-known-error": "CANNOT_GET_OWN_USER_WITHOUT_USER",
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some fields may have been hidden>,
      },
    }
  `);
  const res2 = await Auth.Password.signInWithEmail({ password: res.password });
  expect(res2.signInResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "access_token": <stripped field 'access_token'>,
        "refresh_token": <stripped field 'refresh_token'>,
        "user_id": "<stripped UUID>",
      },
      "headers": Headers {
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some fields may have been hidden>,
      },
    }
  `);
  const currentUserResponse2 = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
  expect(currentUserResponse2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "auth_with_email": true,
        "client_metadata": null,
        "display_name": null,
        "has_password": true,
        "id": "<stripped UUID>",
        "oauth_providers": [],
        "primary_email": "<stripped UUID>@stack-generated.example.com",
        "primary_email_verified": false,
        "profile_image_url": null,
        "project_id": "internal",
        "selected_team": null,
        "selected_team_id": null,
        "signed_up_at_millis": <stripped field 'signed_up_at_millis'>,
      },
      "headers": Headers {
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some fields may have been hidden>,
      },
    }
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
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should not allow signing in with an incorrect password", async ({ expect }) => {
  const res = await Auth.Password.signUpWithEmail();
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
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some fields may have been hidden>,
      },
    }
  `);
});
