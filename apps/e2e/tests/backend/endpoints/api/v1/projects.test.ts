import { describe } from "vitest";
import { it } from "../../../../helpers";
import { Auth, InternalProjectKeys, Project, backendContext, niceBackendFetch } from "../../../backend-helpers";


describe("without project access", () => {
  backendContext.set({
    projectKeys: 'no-project'
  });

  it("should not have have access to the project", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1/current-project", { accessType: "client" });
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

describe("with internal project keys", () => {
  backendContext.set({
    projectKeys: InternalProjectKeys,
  });

  it("Get project", async ({ expect }) => {
    const response = await niceBackendFetch("/api/v1/current-project", { accessType: "client" });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "credential_enabled": true,
            "magic_link_enabled": true,
            "oauth_providers": [
              { "id": "facebook" },
              { "id": "github" },
              { "id": "google" },
              { "id": "microsoft" },
            ],
          },
          "display_name": "Stack Dashboard",
          "id": "internal",
        },
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });
});

describe("with new project keys", () => {
  backendContext.set({
    projectKeys: 'no-project'
  });

  it.todo("Get project");
});