import { describe } from "vitest";
import { it } from "../../../../helpers";
import { niceBackendFetch } from "../../../backend-helpers";

describe("without project access", () => {
  it("should not be able to list users", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1/users", {});
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": {
          "code": "ACCESS_TYPE_REQUIRED",
          "error": "You are not allowed to access this Stack project. Make sure project API keys are provided (eg. x-stack-publishable-client-key) and you set the x-stack-access-type header to 'client', 'server', or 'admin'.",
        },
        "headers": _Headers {
          "x-stack-known-error": "ACCESS_TYPE_REQUIRED",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some headers may have been hidden>,
        },
      }
    `);
  });
});

describe("with client access", () => {
  it("should not be able to list users", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1/users", {
      internalProject: true,
      accessType: "client",
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 401,
        "body": {
          "code": "INSUFFICIENT_ACCESS_TYPE",
          "details": {
            "actualAccessType": "client",
            "allowedAccessTypes": [
              "server",
              "admin",
            ],
          },
          "error": "The x-stack-access-type header must be 'server' or 'admin', but was 'client'.",
        },
        "headers": _Headers {
          "x-stack-known-error": "INSUFFICIENT_ACCESS_TYPE",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some headers may have been hidden>,
        },
      }
    `);
  });
});
