import { describe } from "vitest";
import { it } from "../../../../../helpers";
import { Auth, InternalProjectKeys, backendContext, niceBackendFetch } from "../../../../backend-helpers";


describe("without project access", () => {
  backendContext.set({
    projectKeys: 'no-project'
  });

  it("should not have have access to the project", async ({ expect }) => {
    const response1 = await niceBackendFetch("/api/v1/internal/projects", { accessType: "client" });
    expect(response1).toMatchInlineSnapshot(`
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

describe("with internal project ID", async () => {
  backendContext.set({
    projectKeys: InternalProjectKeys,
  });

  it("list all current projects without signing in (not allowed)", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1/internal/projects", { accessType: "client" });
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

  it("list all current projects (empty list)", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response = await niceBackendFetch("/api/v1/internal/projects", { accessType: "client" });
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

  it("create a new project", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response = await niceBackendFetch("/api/v1/internal/projects", {
      accessType: "client",
      method: "POST",
      body: {
        display_name: "New Project"
      },
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 201,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": <stripped field 'id'>,
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": <stripped field 'id'>,
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers {
          "location": "http://localhost:8102/api/v1/internal/projects",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });
});