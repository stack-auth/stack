import { it } from "../../../../../../../helpers";
import { niceBackendFetch } from "../../../../../../backend-helpers";

export async function provisionProject() {
  return await niceBackendFetch("/api/v1/integrations/neon/projects/provision", {
    method: "POST",
    body: {
      display_name: "Test project",
    },
    headers: {
      "Authorization": "Basic bmVvbi1sb2NhbDpuZW9uLWxvY2FsLXNlY3JldA==",
    },
  });
}

it("should be able to provision a new project if neon client details are correct", async ({ expect }) => {
  const response = await provisionProject();
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "project_id": "<stripped UUID>",
        "super_secret_admin_key": <stripped field 'super_secret_admin_key'>,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should fail if the neon client details are incorrect", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/integrations/neon/projects/provision", {
    method: "POST",
    body: {
      display_name: "Test project",
    },
    headers: {
      "Authorization": "Basic bmVvbi1sb2NhbDpuZW9uLWxvY2FsLXMlY3JldA==",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "SCHEMA_ERROR",
        "details": { "message": "Request validation failed on POST /api/v1/integrations/neon/projects/provision:\\n  - Invalid client_id:client_secret values; did you use the correct values for the Neon integration?" },
        "error": "Request validation failed on POST /api/v1/integrations/neon/projects/provision:\\n  - Invalid client_id:client_secret values; did you use the correct values for the Neon integration?",
      },
      "headers": Headers {
        "x-stack-known-error": "SCHEMA_ERROR",
        <some fields may have been hidden>,
      },
    }
  `);
});


it("should fail if the neon client details are missing", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/integrations/neon/projects/provision", {
    method: "POST",
    body: {
      display_name: "Test project",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "SCHEMA_ERROR",
        "details": { "message": "Request validation failed on POST /api/v1/integrations/neon/projects/provision:\\n  - headers.authorization must be defined" },
        "error": "Request validation failed on POST /api/v1/integrations/neon/projects/provision:\\n  - headers.authorization must be defined",
      },
      "headers": Headers {
        "x-stack-known-error": "SCHEMA_ERROR",
        <some fields may have been hidden>,
      },
    }
  `);
});
