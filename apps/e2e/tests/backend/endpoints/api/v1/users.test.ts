import { describe } from "vitest";
import { it } from "../../../../helpers";
import { Auth, InternalProjectKeys, backendContext, niceBackendFetch } from "../../../backend-helpers";

describe("without project access", () => {
  backendContext.set({
    projectKeys: "no-project",
  });

  it("should not be able to read own user", async ({ expect }) => {
    await backendContext.with({
      projectKeys: InternalProjectKeys,
    }, async () => {
      await Auth.Otp.signIn();
    });
    const response = await niceBackendFetch("/api/v1/users/me");
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": {
          "code": "ACCESS_TYPE_REQUIRED",
          "error": "You must specify an access level for this Stack project. Make sure project API keys are provided (eg. x-stack-publishable-client-key) and you set the x-stack-access-type header to 'client', 'server', or 'admin'.",
        },
        "headers": Headers {
          "x-stack-known-error": "ACCESS_TYPE_REQUIRED",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("should not be able to list users", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1/users");
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": {
          "code": "ACCESS_TYPE_REQUIRED",
          "error": "You must specify an access level for this Stack project. Make sure project API keys are provided (eg. x-stack-publishable-client-key) and you set the x-stack-access-type header to 'client', 'server', or 'admin'.",
        },
        "headers": Headers {
          "x-stack-known-error": "ACCESS_TYPE_REQUIRED",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });
});

describe("with client access", () => {
  it("should not be able to read own user if not signed in", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1/users/me", {
      accessType: "client",
    });
    expect(response).toMatchInlineSnapshot(`
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
  });

  it("should be able to read own user if signed in", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response = await niceBackendFetch("/api/v1/users/me", {
      accessType: "client",
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "auth_with_email": true,
          "client_metadata": null,
          "display_name": null,
          "has_password": false,
          "id": <stripped field 'id'>,
          "oauth_providers": [],
          "primary_email": <stripped auto-generated e-mail>,
          "primary_email_verified": true,
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

  it("should be able to update own user", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response1 = await niceBackendFetch("/api/v1/users/me", {
      accessType: "client",
      method: "PATCH",
      body: {
        display_name: "John Doe",
      },
    });
    expect(response1).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "auth_with_email": true,
          "client_metadata": null,
          "display_name": "John Doe",
          "has_password": false,
          "id": <stripped field 'id'>,
          "oauth_providers": [],
          "primary_email": <stripped auto-generated e-mail>,
          "primary_email_verified": true,
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
    const response2 = await niceBackendFetch("/api/v1/users/me", {
      accessType: "client",
      method: "PATCH",
      body: {
        client_metadata: { key: "value" },
      },
    });
    expect(response2).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "auth_with_email": true,
          "client_metadata": { "key": "value" },
          "display_name": "John Doe",
          "has_password": false,
          "id": <stripped field 'id'>,
          "oauth_providers": [],
          "primary_email": <stripped auto-generated e-mail>,
          "primary_email_verified": true,
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

  it("should not be able to set own server_metadata", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response = await niceBackendFetch("/api/v1/users/me", {
      accessType: "client",
      method: "PATCH",
      body: {
        display_name: "Johnny Doe",
        server_metadata: { "key": "value" },
      },
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": {
          "code": "SCHEMA_ERROR",
          "error": "Request validation failed on PATCH /api/v1/users/me:\\n  - body contains unknown properties: server_metadata",
        },
        "headers": Headers {
          "x-stack-known-error": "SCHEMA_ERROR",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("should not be able to delete own user", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response = await niceBackendFetch("/api/v1/users/me", {
      accessType: "client",
      method: "DELETE",
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 401,
        "body": {
          "code": "INSUFFICIENT_ACCESS_TYPE",
          "details": {
            "actual_access_type": "client",
            "allowed_access_types": [
              "server",
              "admin",
            ],
          },
          "error": "The x-stack-access-type header must be 'server' or 'admin', but was 'client'.",
        },
        "headers": Headers {
          "x-stack-known-error": "INSUFFICIENT_ACCESS_TYPE",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it.todo("should not be able to create own user");

  it("updating own display name to the empty string should set it to null", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response1 = await niceBackendFetch("/api/v1/users/me", {
      accessType: "client",
      method: "PATCH",
      body: {
        display_name: "John Doe",
      },
    });
    expect(response1).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "auth_with_email": true,
          "client_metadata": null,
          "display_name": "John Doe",
          "has_password": false,
          "id": <stripped field 'id'>,
          "oauth_providers": [],
          "primary_email": <stripped auto-generated e-mail>,
          "primary_email_verified": true,
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
    const response2 = await niceBackendFetch("/api/v1/users/me", {
      accessType: "client",
      method: "PATCH",
      body: {
        display_name: "",
      },
    });
    expect(response2).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "auth_with_email": true,
          "client_metadata": null,
          "display_name": null,
          "has_password": false,
          "id": <stripped field 'id'>,
          "oauth_providers": [],
          "primary_email": <stripped auto-generated e-mail>,
          "primary_email_verified": true,
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

  it("should not be able to list users", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1/users", {
      accessType: "client",
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 401,
        "body": {
          "code": "INSUFFICIENT_ACCESS_TYPE",
          "details": {
            "actual_access_type": "client",
            "allowed_access_types": [
              "server",
              "admin",
            ],
          },
          "error": "The x-stack-access-type header must be 'server' or 'admin', but was 'client'.",
        },
        "headers": Headers {
          "x-stack-known-error": "INSUFFICIENT_ACCESS_TYPE",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("should not be able to read a user", async ({ expect }) => {
    await Auth.Otp.signIn();
    backendContext.set({
      userAuth: null,
    });
    const response = await niceBackendFetch("/api/v1/users/123", {
      accessType: "client",
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 401,
        "body": {
          "code": "INSUFFICIENT_ACCESS_TYPE",
          "details": {
            "actual_access_type": "client",
            "allowed_access_types": [
              "server",
              "admin",
            ],
          },
          "error": "The x-stack-access-type header must be 'server' or 'admin', but was 'client'.",
        },
        "headers": Headers {
          "x-stack-known-error": "INSUFFICIENT_ACCESS_TYPE",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it.todo("should be able to set selected team id, updating the selected team object");
});

describe("with server access", () => {
  it("should be able to read own user", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response = await niceBackendFetch("/api/v1/users/me", {
      accessType: "server",
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "auth_with_email": true,
          "client_metadata": null,
          "display_name": null,
          "has_password": false,
          "id": <stripped field 'id'>,
          "oauth_providers": [],
          "primary_email": <stripped auto-generated e-mail>,
          "primary_email_verified": true,
          "profile_image_url": null,
          "project_id": "internal",
          "selected_team": null,
          "selected_team_id": null,
          "server_metadata": null,
          "signed_up_at_millis": <stripped field 'signed_up_at_millis'>,
        },
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("should be able to update own user", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response = await niceBackendFetch("/api/v1/users/me", {
      accessType: "server",
      method: "PATCH",
      body: {
        display_name: "John Doe",
      },
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "auth_with_email": true,
          "client_metadata": null,
          "display_name": "John Doe",
          "has_password": false,
          "id": <stripped field 'id'>,
          "oauth_providers": [],
          "primary_email": <stripped auto-generated e-mail>,
          "primary_email_verified": true,
          "profile_image_url": null,
          "project_id": "internal",
          "selected_team": null,
          "selected_team_id": null,
          "server_metadata": null,
          "signed_up_at_millis": <stripped field 'signed_up_at_millis'>,
        },
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("should be able to delete own user", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response = await niceBackendFetch("/api/v1/users/me", {
      accessType: "server",
      method: "DELETE",
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": ArrayBuffer {},
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it.todo("should be able to list users");

  it("should be able to read a user", async ({ expect }) => {
    await Auth.Otp.signIn();
    backendContext.set({
      userAuth: null,
    });
    const response = await niceBackendFetch("/api/v1/users/123", {
      accessType: "server",
    });
  });

  it.todo("should not be able to create a user");

  it.todo("should be able to update a user");

  it.todo("should be able to delete a user");

});
