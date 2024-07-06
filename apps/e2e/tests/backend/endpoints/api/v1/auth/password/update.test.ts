import { it } from "../../../../../../helpers";
import { Auth, backendContext, niceBackendFetch } from "../../../../../backend-helpers";

it("should allow updating existing passwords", async ({ expect }) => {
  const signUpRes = await Auth.Password.signUpWithEmail();
  const oldPassword = signUpRes.password;
  const newPassword = "new-password";
  const response = await niceBackendFetch("/api/v1/auth/password/update", {
    method: "POST",
    accessType: "client",
    body: {
      old_password: oldPassword,
      new_password: newPassword,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
  await Auth.signOut();
  await Auth.Password.signInWithEmail({ password: newPassword });
  const userResponse = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
  expect(userResponse).toMatchInlineSnapshot(`
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should not allow updating passwords without old password", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  const newPassword = "new-password";
  const response = await niceBackendFetch("/api/v1/auth/password/update", {
    method: "POST",
    accessType: "admin",
    body: {
      new_password: newPassword,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "SCHEMA_ERROR",
        "error": "Request validation failed on POST /api/v1/auth/password/update:\\n  - body.old_password is a required field",
      },
      "headers": Headers {
        "x-stack-known-error": "SCHEMA_ERROR",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should not allow updating passwords if the provided old password is wrong", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  const newPassword = "new-password";
  const response = await niceBackendFetch("/api/v1/auth/password/update", {
    method: "POST",
    accessType: "client",
    body: {
      old_password: "wrong-password",
      new_password: newPassword,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "PASSWORD_CONFIRMATION_MISMATCH",
        "error": "Passwords do not match.",
      },
      "headers": Headers {
        "x-stack-known-error": "PASSWORD_CONFIRMATION_MISMATCH",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should not allow updating passwords if the user does not have password authentication enabled", async ({ expect }) => {
  await Auth.Otp.signIn();
  const newPassword = "new-password";
  const response = await niceBackendFetch("/api/v1/auth/password/update", {
    method: "POST",
    accessType: "client",
    body: {
      old_password: "wrong-password",
      new_password: newPassword,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "USER_DOES_NOT_HAVE_PASSWORD",
        "error": "This user does not have password authentication enabled.",
      },
      "headers": Headers {
        "x-stack-known-error": "USER_DOES_NOT_HAVE_PASSWORD",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should not allow updating password when not logged in", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/auth/password/update", {
    method: "POST",
    accessType: "client",
    body: {
      old_password: "something-123",
      new_password: "other-thing-123",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "SCHEMA_ERROR",
        "error": "Request validation failed on POST /api/v1/auth/password/update:\\n  - auth.user is a required field",
      },
      "headers": Headers {
        "x-stack-known-error": "SCHEMA_ERROR",
        <some fields may have been hidden>,
      },
    }
  `);
});
