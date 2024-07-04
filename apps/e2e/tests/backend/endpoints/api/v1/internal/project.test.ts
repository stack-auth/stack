import { describe } from "vitest";
import { it } from "../../../../../helpers";
import { InternalProjectKeys, backendContext, niceBackendFetch } from "../../../../backend-helpers";


describe("without project access", () => {
  backendContext.set({
    projectKeys: 'no-project'
  });

  it("should not have have access to the project", async ({ expect }) => {
    const response1 = await niceBackendFetch("/api/v1/internal/projects", { accessType: "admin" });
    expect(response1).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": {
          "code": "REQUEST_TYPE_WITHOUT_PROJECT_ID",
          "details": { "request_type": "admin" },
          "error": "The x-stack-request-type header was 'admin', but the x-stack-project-id header was not provided.",
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

  it("List all current projects", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1/internal/projects", { accessType: "admin" });
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
});