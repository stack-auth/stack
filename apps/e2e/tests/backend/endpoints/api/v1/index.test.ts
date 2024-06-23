import { it } from "../../../../helpers";
import { InternalProjectKeys, backendContext, niceBackendFetch } from "../../../backend-helpers";
import { describe } from "vitest";

describe("without project ID", () => {
  backendContext.set({
    projectKeys: "no-project",
  });

  it("should load", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1");
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": "Welcome to the Stack API endpoint! Please refer to the documentation at https://docs.stack-auth.com.\\n\\nAuthentication: None",
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("should not have client access", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1", {
      accessType: "client",
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": {
          "code": "REQUEST_TYPE_WITHOUT_PROJECT_ID",
          "details": { "requestType": "client" },
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

  it.todo("should not be able to authenticate as user");
});

describe("with internal project ID", async () => {
  backendContext.set({
    projectKeys: InternalProjectKeys,
  });

  it("should not have server access without server API key", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1", {
      accessType: "server",
      headers: {
        "x-stack-secret-server-key": "",
      },
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 401,
        "body": {
          "code": "SERVER_AUTHENTICATION_REQUIRED",
          "error": "The secret server key must be provided.",
        },
        "headers": Headers {
          "x-stack-known-error": "SERVER_AUTHENTICATION_REQUIRED",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it.todo("should not be able to authenticate as user without client API key");

  describe("with API keys", () => {
    it("should have client access", async ({ expect }) => {
      const response = await niceBackendFetch("/api/v1", {
        accessType: "client",
      });
      expect(response).toMatchInlineSnapshot(`
        NiceResponse {
          "status": 200,
          "body": "Welcome to the Stack API endpoint! Please refer to the documentation at https://docs.stack-auth.com.\\n\\nAuthentication: Client\\n         Project: internal\\n         User: None",
          "headers": Headers {
            "x-stack-request-id": <stripped header 'x-stack-request-id'>,
            <some fields may have been hidden>,
          },
        }
      `);
    });

    it("should have server access", async ({ expect }) => {
      const response = await niceBackendFetch("/api/v1", {
        accessType: "server",
      });
      expect(response).toMatchInlineSnapshot(`
        NiceResponse {
          "status": 200,
          "body": "Welcome to the Stack API endpoint! Please refer to the documentation at https://docs.stack-auth.com.\\n\\nAuthentication: Server\\n         Project: internal\\n         User: None",
          "headers": Headers {
            "x-stack-request-id": <stripped header 'x-stack-request-id'>,
            <some fields may have been hidden>,
          },
        }
      `);
    });

    it("should have admin access", async ({ expect }) => {
      const response = await niceBackendFetch("/api/v1", {
        accessType: "admin",
      });
      expect(response).toMatchInlineSnapshot(`
        NiceResponse {
          "status": 401,
          "body": {
            "code": "ADMIN_AUTHENTICATION_REQUIRED",
            "error": "The super secret admin key must be provided.",
          },
          "headers": Headers {
            "x-stack-known-error": "ADMIN_AUTHENTICATION_REQUIRED",
            "x-stack-request-id": <stripped header 'x-stack-request-id'>,
            <some fields may have been hidden>,
          },
        }
      `);
    });

    it.todo("should be able to authenticate as user");
  });

  describe("with admin API key", () => {
    it.todo("should have client access");

    it.todo("should have admin access");
  });
});
