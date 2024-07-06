import { it } from "../../../../../../../helpers";
import { Auth, niceBackendFetch } from "../../../../../../backend-helpers";

it("should sign out users", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  const currentUserResponse1 = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
  expect(currentUserResponse1).toMatchInlineSnapshot(`
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
  const res = await Auth.signOut();
  expect(res.signOutResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "headers": Headers {
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some fields may have been hidden>,
      },
    }
  `);
  const currentUserResponse2 = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
  expect(currentUserResponse2).toMatchInlineSnapshot(`
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
  const refreshSessionResponse = await niceBackendFetch("/api/v1/auth/sessions/current/refresh", {
    method: "POST",
    accessType: "client",
  });
  expect(refreshSessionResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 401,
      "body": {
        "code": "REFRESH_TOKEN_NOT_FOUND",
        "error": "Refresh token not found for this project.",
      },
      "headers": Headers {
        "x-stack-known-error": "REFRESH_TOKEN_NOT_FOUND",
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should not sign out users given invalid refresh token", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  const response = await niceBackendFetch("/api/v1/auth/sessions/current", {
    method: "DELETE",
    accessType: "client",
    headers: {
      "x-stack-refresh-token": "something-invalid",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 401,
      "body": {
        "code": "REFRESH_TOKEN_NOT_FOUND",
        "error": "Refresh token not found for this project.",
      },
      "headers": Headers {
        "x-stack-known-error": "REFRESH_TOKEN_NOT_FOUND",
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some fields may have been hidden>,
      },
    }
  `);
});

it.todo("should not sign out users of a different project");

// TODO currently not supported, the endpoint just throws an error when only access token is given
it.todo("should sign out users even without refresh token");
