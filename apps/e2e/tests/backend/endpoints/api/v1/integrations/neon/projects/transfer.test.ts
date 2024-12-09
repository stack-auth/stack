import { expect } from "vitest";
import { it } from "../../../../../../../helpers";
import { Auth, Project, niceBackendFetch } from "../../../../../../backend-helpers";
import { provisionProject } from "./provision.test";

async function initiateTransfer(projectId: string) {
  const response = await niceBackendFetch("/api/v1/integrations/neon/projects/transfer/initiate", {
    method: "POST",
    body: {
      project_id: projectId,
    },
    headers: {
      "Authorization": "Basic bmVvbi1sb2NhbDpuZW9uLWxvY2FsLXNlY3JldA==",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "confirmation_url": "http://localhost:8101/integrations/neon/projects/transfer/confirm?code=%3Cstripped+query+param%3E" },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
  const confirmationUrl = new URL(response.body.confirmation_url);
  const code = confirmationUrl.searchParams.get("code")!;
  return { code };
}

it("should be able to transfer a project exactly once", async ({ expect }) => {
  const provisioned = await provisionProject();
  const projectId = provisioned.body.project_id;
  const { code } = await initiateTransfer(projectId);
  await Auth.Otp.signIn();
  const response = await niceBackendFetch(`/api/v1/integrations/neon/projects/transfer/confirm`, {
    method: "POST",
    accessType: "client",
    body: {
      code,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "project_id": "<stripped UUID>" },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
  expect(response.body.project_id).toBe(projectId);

  // but only once!
  const response2 = await niceBackendFetch("/api/v1/integrations/neon/projects/transfer/initiate", {
    method: "POST",
    body: {
      project_id: projectId,
    },
    headers: {
      "Authorization": "Basic bmVvbi1sb2NhbDpuZW9uLWxvY2FsLXNlY3JldA==",
    },
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": "This project either doesn't exist or the current Neon client is not authorized to transfer it. Note that projects can only be transferred once.",
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should fail if the project to transfer was not provisioned by Neon", async ({ expect }) => {
  await Auth.Otp.signIn();
  const createdProject = await Project.create();
  const response = await niceBackendFetch("/api/v1/integrations/neon/projects/transfer/initiate", {
    method: "POST",
    body: {
      project_id: createdProject.createProjectResponse.body.id,
    },
    headers: {
      "Authorization": "Basic bmVvbi1sb2NhbDpuZW9uLWxvY2FsLXNlY3JldA==",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": "This project either doesn't exist or the current Neon client is not authorized to transfer it. Note that projects can only be transferred once.",
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should fail if the neon client details are missing", async ({ expect }) => {
  const provisioned = await provisionProject();
  const response = await niceBackendFetch("/api/v1/integrations/neon/projects/transfer/initiate", {
    method: "POST",
    body: {
      project_id: provisioned.body.project_id,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "SCHEMA_ERROR",
        "details": { "message": "Request validation failed on POST /api/v1/integrations/neon/projects/transfer/initiate:\\n  - headers.authorization must be defined" },
        "error": "Request validation failed on POST /api/v1/integrations/neon/projects/transfer/initiate:\\n  - headers.authorization must be defined",
      },
      "headers": Headers {
        "x-stack-known-error": "SCHEMA_ERROR",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should fail to transfer project if the user is not signed in", async ({ expect }) => {
  const provisioned = await provisionProject();
  const projectId = provisioned.body.project_id;
  const { code } = await initiateTransfer(projectId);
  const response = await niceBackendFetch(`/api/v1/integrations/neon/projects/transfer/confirm`, {
    method: "POST",
    body: {
      code,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "ACCESS_TYPE_REQUIRED",
        "error": "You must specify an access level for this Stack project. Make sure project API keys are provided (eg. x-stack-publishable-client-key) and you set the x-stack-access-type header to 'client', 'server', or 'admin'.\\n\\nFor more information, see the docs on REST API authentication: https://docs.stack-auth.com/rest-api/auth#authentication",
      },
      "headers": Headers {
        "x-stack-known-error": "ACCESS_TYPE_REQUIRED",
        <some fields may have been hidden>,
      },
    }
  `);
});
