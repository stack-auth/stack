import { describe } from "vitest";
import { it } from "../../../../../helpers";
import { Auth, InternalProjectClientKeys, Project, backendContext, niceBackendFetch } from "../../../../backend-helpers";


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
          <some fields may have been hidden>,
        },
      }
    `);
  });
});


describe("with a non-internal project", async () => {
  it.todo("list all current projects (not allowed)");
  it.todo("create a new project (not allowed)");
});

describe("with the internal project access", async () => {
  backendContext.set({
    projectKeys: InternalProjectClientKeys,
  });

  it("lists all current projects without signing in (not allowed)", async ({ expect }) => {
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
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("lists all current projects (empty list)", async ({ expect }) => {
    await Auth.Otp.signIn();
    const response = await niceBackendFetch("/api/v1/internal/projects", { accessType: "client" });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "is_paginated": false,
          "items": [],
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
  });

  it("creates a new project", async ({ expect }) => {
    await Auth.Otp.signIn();
    const result = await Project.create({
      display_name: "Test Project",
    });
    expect(result.createProjectResponse).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 201,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "Test Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
  });

  it("creates a new project with different configurations", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { createProjectResponse: response1 } = await Project.create({
      display_name: "Test Project",
      description: "Test description",
      is_production_mode: true,
      config: {
        allow_localhost: false,
        credential_enabled: false,
        magic_link_enabled: true,
      },
    });
    expect(response1).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 201,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": true,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "Test description",
          "display_name": "Test Project",
          "id": "<stripped UUID>",
          "is_production_mode": true,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);

    // create with oauth providers
    const { createProjectResponse: response2 } = await Project.create({
      display_name: "Test Project",
      config: {
        oauth_providers: [
          {
            id: "google",
            type: "shared",
            enabled: true,
          },
          {
            id: "facebook",
            type: "standard",
            enabled: false,
            client_id: "client_id",
            client_secret: "client_secret",
          }
        ]
      },
    });
    expect(response2).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 201,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [
              {
                "client_id": "client_id",
                "client_secret": "client_secret",
                "enabled": false,
                "id": "facebook",
                "type": "standard",
              },
              {
                "enabled": true,
                "id": "google",
                "type": "shared",
              },
            ],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "Test Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);

    // create with shared email config
    const { createProjectResponse: response3 } = await Project.create({
      display_name: "Test Project",
      config: {
        email_config: {
          type: "shared",
        },
      },
    });
    expect(response3).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 201,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "Test Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);

    // create with standard email config
    const { createProjectResponse: response4 } = await Project.create({
      display_name: "Test Project",
      config: {
        email_config: {
          type: "standard",
          host: "smtp.example.com",
          port: 587,
          username: "test username",
          password: "test password",
          sender_name: "Test Sender",
          sender_email: "test@email.com",
        },
      },
    });
    expect(response4).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 201,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": {
              "host": "smtp.example.com",
              "password": "test password",
              "port": 587,
              "sender_email": "test@email.com",
              "sender_name": "Test Sender",
              "type": "standard",
              "username": "test username",
            },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "Test Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);

    // create with domains
    const { createProjectResponse: response5 } = await Project.create({
      display_name: "Test Project",
      config: {
        domains: [
          {
            domain: 'https://domain1.com',
            handler_path: '/handler1'
          },
          {
            domain: 'https://domain2.com',
            handler_path: '/handler2'
          }
        ]
      },
    });
    expect(response5).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 201,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [
              {
                "domain": "https://domain1.com",
                "handler_path": "/handler1",
              },
              {
                "domain": "https://domain2.com",
                "handler_path": "/handler2",
              },
            ],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "Test Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
  });

  it("lists the current projects after creating a new project", async ({ expect }) => {
    await Auth.Otp.signIn();
    await Project.create();
    const response = await niceBackendFetch("/api/v1/internal/projects", { accessType: "client" });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "is_paginated": false,
          "items": [
            {
              "config": {
                "allow_localhost": true,
                "credential_enabled": true,
                "domains": [],
                "email_config": { "type": "shared" },
                "id": "<stripped UUID>",
                "magic_link_enabled": false,
                "oauth_providers": [],
              },
              "created_at_millis": <stripped field 'created_at_millis'>,
              "description": "",
              "display_name": "New Project",
              "id": "<stripped UUID>",
              "is_production_mode": false,
              "user_count": 0,
            },
          ],
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
  });

  it("gets a project that does not exist", async ({ expect }) => {
    await Auth.Otp.signIn();
    await Project.create();
    const response = await niceBackendFetch("/api/v1/internal/projects/does-not-exist", { accessType: "client" });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 404,
        "body": {
          "code": "PROJECT_NOT_FOUND",
          "error": "Project not found or is not accessible with the current user.",
        },
        "headers": Headers {
          "x-stack-known-error": "PROJECT_NOT_FOUND",
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("gets a project that exists", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId } = await Project.create();
    const response = await niceBackendFetch(`/api/v1/internal/projects/${projectId}`, { accessType: "client" });
    expect(response.body.id).toBe(projectId);
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
  });

  it("updates a project that does not exist", async ({ expect }) => {
    await Auth.Otp.signIn();
    await Project.create();
    const { updateProjectResponse: response } = await Project.update("does-not-exist", {});
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 404,
        "body": {
          "code": "PROJECT_NOT_FOUND",
          "error": "Project not found or is not accessible with the current user.",
        },
        "headers": Headers {
          "x-stack-known-error": "PROJECT_NOT_FOUND",
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("updates the basic project information", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId } = await Project.create();
    const { updateProjectResponse: response } = await Project.update(projectId, {
      display_name: "Updated Project",
      description: "Updated description",
      is_production_mode: true,
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "Updated description",
          "display_name": "Updated Project",
          "id": "<stripped UUID>",
          "is_production_mode": true,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
  });

  it("updates the basic project configuration", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId } = await Project.create();
    const { updateProjectResponse: response } = await Project.update(projectId, {
      config: {
        allow_localhost: false,
        credential_enabled: false,
        magic_link_enabled: true,
      },
    });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": false,
            "credential_enabled": false,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": true,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
  });

  it("updates the project domains configuration", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId: projectId1 } = await Project.create();
    const { updateProjectResponse: response1 } = await Project.update(projectId1, {
      config: {
        domains: [{
          domain: 'https://domain.com',
          handler_path: '/handler'
        }]
      },
    });
    expect(response1).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [
              {
                "domain": "https://domain.com",
                "handler_path": "/handler",
              },
            ],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);

    const { updateProjectResponse: response2 } = await Project.update(projectId1, {
      config: {
        domains: [
          {
            domain: 'https://domain2.com',
            handler_path: '/handler'
          },
          {
            domain: 'https://domain3.com',
            handler_path: '/handler2'
          }
        ]
      },
    });
    expect(response2).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [
              {
                "domain": "https://domain2.com",
                "handler_path": "/handler",
              },
              {
                "domain": "https://domain3.com",
                "handler_path": "/handler2",
              },
            ],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
    
    // create another project and update its domain
    const { projectId: projectId2 } = await Project.create();
    const { updateProjectResponse: response1p2 } = await Project.update(projectId2, {
      config: {
        domains: [{
          domain: 'https://domain3.com',
          handler_path: '/handler'
        }]
      },
    });
    expect(response1p2).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [
              {
                "domain": "https://domain3.com",
                "handler_path": "/handler",
              },
            ],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
    
    // check if the first project still has the same domains
    const response3 = await niceBackendFetch(`/api/v1/internal/projects/${projectId1}`, {
      accessType: "client",
      method: "GET",
    });
    expect(response3).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [
              {
                "domain": "https://domain2.com",
                "handler_path": "/handler",
              },
              {
                "domain": "https://domain3.com",
                "handler_path": "/handler2",
              },
            ],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
  });

  it("updates the project email configuration", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId: projectId1 } = await Project.create();

    // create standard email config
    const { updateProjectResponse: response1 } = await Project.update(projectId1, {
      config: {
        email_config: {
          type: "standard",
          host: "smtp.example.com",
          port: 587,
          username: "test username",
          password: "test password",
          sender_name: "Test Sender",
          sender_email: "test@email.com",
        },
      },
    });
    expect(response1).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": {
              "host": "smtp.example.com",
              "password": "test password",
              "port": 587,
              "sender_email": "test@email.com",
              "sender_name": "Test Sender",
              "type": "standard",
              "username": "test username",
            },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);

    // create another project and update its email config
    const { projectId: projectId2 } = await Project.create();
    const { updateProjectResponse: response1p2 } = await Project.update(projectId2, {
      config: {
        email_config: {
          type: "standard",
          host: "smtp.control-group.com",
          port: 587,
          username: "control group",
          password: "control group",
          sender_name: "Control Group",
          sender_email: "control-group@email.com",
        },
      },
    });
    expect(response1p2).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": {
              "host": "smtp.control-group.com",
              "password": "control group",
              "port": 587,
              "sender_email": "control-group@email.com",
              "sender_name": "Control Group",
              "type": "standard",
              "username": "control group",
            },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
    
    // update standard email config again
    const { updateProjectResponse: response2 } = await Project.update(projectId1, {
      config: {
        email_config: {
          type: "standard",
          host: "smtp.example2.com",
          port: 587,
          username: "test username2",
          password: "test password2",
          sender_name: "Test Sender2",
          sender_email: "test@email.com2",
        },
      },
    });
    expect(response2).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": {
              "host": "smtp.example2.com",
              "password": "test password2",
              "port": 587,
              "sender_email": "test@email.com2",
              "sender_name": "Test Sender2",
              "type": "standard",
              "username": "test username2",
            },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);

    // switch back to shared email config
    const { updateProjectResponse: response3 } = await Project.update(projectId1, {
      config: {
        email_config: {
          type: "shared",
        },
      },
    });
    expect(response3).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);

    // update to shared again
    const { updateProjectResponse: response4 } = await Project.update(projectId1, {
      config: {
        email_config: {
          type: "shared",
        },
      },
    });
    expect(response4).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);

    // check if the second project still has the same email config
    const { updateProjectResponse: response2p2 } = await Project.update(projectId2, {
      config: {
        email_config: {
          type: "standard",
          host: "smtp.control-group.com",
          port: 587,
          username: "control group",
          password: "control group",
          sender_name: "Control Group",
          sender_email: "control-group@email.com",
        },
      },
    });
    expect(response2p2).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": {
              "host": "smtp.control-group.com",
              "password": "control group",
              "port": 587,
              "sender_email": "control-group@email.com",
              "sender_name": "Control Group",
              "type": "standard",
              "username": "control group",
            },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
  });

  it("updates the project email configuration with the wrong parameters", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId } = await Project.create();
    const { updateProjectResponse: response1 } = await Project.update(projectId, {
      config: {
        email_config: {
          type: "shared",
          client_id: "client_id",
        },
      },
    });
    expect(response1).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": {
          "code": "SCHEMA_ERROR",
          "error": "Request validation failed on PATCH /api/v1/internal/projects/<stripped UUID>:\\n  - body.config.email_config contains unknown properties: client_id",
        },
        "headers": Headers {
          "x-stack-known-error": "SCHEMA_ERROR",
          <some fields may have been hidden>,
        },
      }
    `);

    const response2 = await niceBackendFetch(`/api/v1/internal/projects/${projectId}`, {
      accessType: "client",
      method: "PATCH",
      body: {
        config: {
          email_config: {
            type: "standard",
          },
        },
      },
    });
    expect(response2).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": {
          "code": "SCHEMA_ERROR",
          "error": "Request validation failed on PATCH /api/v1/internal/projects/<stripped UUID>:\\n  - body.config.email_config.sender_name is a required field\\n  - body.config.email_config.host is a required field\\n  - body.config.email_config.port is a required field\\n  - body.config.email_config.username is a required field\\n  - body.config.email_config.password is a required field\\n  - body.config.email_config.sender_email is a required field",
        },
        "headers": Headers {
          "x-stack-known-error": "SCHEMA_ERROR",
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("updates the project oauth configuration", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId } = await Project.create();
    // create google oauth provider with shared type
    const { updateProjectResponse: response1 } = await Project.update(projectId, {
      config: {
        oauth_providers: [{
          id: "google",
          type: "shared",
          enabled: true,
        }]
      },
    });
    expect(response1).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [
              {
                "enabled": true,
                "id": "google",
                "type": "shared",
              },
            ],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
    
    // update google oauth provider with shared type again
    const { updateProjectResponse: response2 } = await Project.update(projectId, {
      config: {
        oauth_providers: [{
          id: "google",
          type: "shared",
          enabled: true,
        }]
      },
    });
    expect(response2).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [
              {
                "enabled": true,
                "id": "google",
                "type": "shared",
              },
            ],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);

    // switch to standard type
    const { updateProjectResponse: response3 } = await Project.update(projectId, {
      config: {
        oauth_providers: [{
          id: "google",
          type: "standard",
          enabled: true,
          client_id: "client_id",
          client_secret: "client_secret",
        }]
      },
    });
    expect(response3).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [
              {
                "client_id": "client_id",
                "client_secret": "client_secret",
                "enabled": true,
                "id": "google",
                "type": "standard",
              },
            ],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);

    // add another oauth provider with invalid type
    const { updateProjectResponse: response4 } = await Project.update(projectId, {
      config: {
        oauth_providers: [{
          id: "facebook",
          type: "shared",
          enabled: true,
        }]
      },
    });
    expect(response4).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 400,
        "body": "Provider with id 'google' not found in the update",
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
    
    // add another oauth provider
    const { updateProjectResponse: response5 } = await Project.update(projectId, {
      config: {
        oauth_providers: [
          {
            id: "facebook",
            type: "shared",
            enabled: true,
          },
          {
            id: "google",
            type: "shared",
            enabled: true,
          }
        ]
      },
    });
    expect(response5).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [
              {
                "enabled": true,
                "id": "facebook",
                "type": "shared",
              },
              {
                "enabled": true,
                "id": "google",
                "type": "shared",
              },
            ],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
    
    // disable one of the oauth providers
    const { updateProjectResponse: response6 } = await Project.update(projectId, {
      config: {
        oauth_providers: [
          {
            id: "facebook",
            type: "shared",
            enabled: true,
          },
          {
            id: "google",
            type: "shared",
            enabled: false,
          }
        ]
      },
    });
    expect(response6).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "config": {
            "allow_localhost": true,
            "credential_enabled": true,
            "domains": [],
            "email_config": { "type": "shared" },
            "id": "<stripped UUID>",
            "magic_link_enabled": false,
            "oauth_providers": [
              {
                "enabled": true,
                "id": "facebook",
                "type": "shared",
              },
              {
                "enabled": false,
                "id": "google",
                "type": "shared",
              },
            ],
          },
          "created_at_millis": <stripped field 'created_at_millis'>,
          "description": "",
          "display_name": "New Project",
          "id": "<stripped UUID>",
          "is_production_mode": false,
          "user_count": 0,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
  });
});
