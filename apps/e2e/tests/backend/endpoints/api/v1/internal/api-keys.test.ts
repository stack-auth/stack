import { describe } from "vitest";
import { it } from "../../../../../helpers";
import { Auth, InternalProjectKeys, backendContext, niceBackendFetch } from "../../../../backend-helpers";


describe("without project access", () => {
  backendContext.set({
    projectKeys: 'no-project'
  });

  it("should not have have access to api keys", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1/internal/api-keys", { accessType: "client" });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": {
          "code": "REQUEST_TYPE_WITHOUT_PROJECT_ID",
          "details": { "request_type": "client" },
          "error": "The x-stack-request-type header was 'client', but the x-stack-project-id header was not provided.",
        },
        "headers": Headers {
          "x-stack-known-error": "REQUEST_TYPE_WITHOUT_PROJECT_ID",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });
});

describe("with internal project", () => {
  backendContext.set({
    projectKeys: InternalProjectKeys,
  });

  it("list api keys without a user (not allowed)", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1/internal/api-keys", { accessType: "client" });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 401,
        "body": {
          "code": "USER_AUTHENTICATION_REQUIRED",
          "error": "User authentication required for this endpoint.",
        },
        "headers": Headers {
          "x-stack-known-error": "USER_AUTHENTICATION_REQUIRED",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("list api keys with a user", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response = await niceBackendFetch("/api/v1/internal/api-keys", { accessType: "client" });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "is_paginated": false,
          "items": [],
        },
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("create api keys", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response1 = await niceBackendFetch("/api/v1/internal/api-keys", {
      accessType: "client",
      method: "POST",
      body: {
        description: "test api key",
        has_publishable_client_key: true,
        has_secret_server_key: true,
        has_super_secret_admin_key: true,
        expires_at_millis: 123,
      },
    });
    expect(response1).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "test api key",
          "expires_at_millis": <stripped field 'expires_at_millis'>,
          "id": "<stripped UUID>",
          "publishable_client_key": <stripped field 'publishable_client_key'>,
          "secret_server_key": <stripped field 'secret_server_key'>,
          "super_secret_admin_key": <stripped field 'super_secret_admin_key'>,
        },
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it.todo("update, delete, create and use api keys");
});

describe("with non internal project", () => {
  it.todo("create api keys");
});
