import { describe } from "vitest";
import { it } from "../../../../helpers";
import { InternalProjectKeys, backendContext, niceBackendFetch } from "../../../backend-helpers";

describe("without project access", () => {
  backendContext.set({
    projectKeys: "no-project",
  });

  it("should not be able to list users", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1/users");
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": {
          "code": "ACCESS_TYPE_REQUIRED",
          "error": "You are not allowed to access this Stack project. Make sure project API keys are provided (eg. x-stack-publishable-client-key) and you set the x-stack-access-type header to 'client', 'server', or 'admin'.",
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

  describe("with server access", () => {
    it.todo("should be able to list users");

    it.todo("should be able to read a user");

    it.todo("should not be able to create a user");

    it.todo("should be able to update a user");

    it.todo("should be able to delete a user");
  });
});
