import { describe } from "vitest";
import { it } from "../../../../../helpers";
import { Auth, InternalProjectKeys, Project, backendContext, niceBackendFetch } from "../../../../backend-helpers";


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
    const result = await Project.createProject({
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
        "headers": Headers {
          "location": "http://localhost:8102/api/v1/internal/projects",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("create a new project with different configurations", async ({ expect }) => {
    await Auth.Otp.signIn();
    const result = await Project.createProject({
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
        "headers": Headers {
          "location": "http://localhost:8102/api/v1/internal/projects",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  // it("list current projects after creating a new project", async ({ expect }) => {
  //   await Auth.Otp.signIn();
  //   await Project.createProject();
  //   const response = await niceBackendFetch("/api/v1/internal/projects", { accessType: "client" });
  //   expect(response).toMatchInlineSnapshot(`
  //     NiceResponse {
  //       "status": 200,
  //       "body": {
  //         "is_paginated": false,
  //         "items": [
  //           {
  //             "config": {
  //               "allow_localhost": true,
  //               "credential_enabled": true,
  //               "domains": [],
  //               "email_config": { "type": "shared" },
  //               "id": "<stripped UUID>",
  //               "magic_link_enabled": false,
  //               "oauth_providers": [],
  //             },
  //             "created_at_millis": <stripped field 'created_at_millis'>,
  //             "description": "",
  //             "display_name": "New Project",
  //             "id": "<stripped UUID>",
  //             "is_production_mode": false,
  //             "user_count": 0,
  //           },
  //         ],
  //       },
  //       "headers": Headers {
  //         "x-stack-request-id": <stripped header 'x-stack-request-id'>,
  //         <some fields may have been hidden>,
  //       },
  //     }
  //   `);
  // });

  it("get a project that does not exist", async ({ expect }) => {
    await Auth.Otp.signIn();
    await Project.createProject();
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
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("get a project that exists", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId } = await Project.createProject();
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("update a project that does not exist", async ({ expect }) => {
    await Auth.Otp.signIn();
    await Project.createProject();
    const { updateProjectResponse: response } = await Project.updateProject("does-not-exist", {});
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 404,
        "body": {
          "code": "PROJECT_NOT_FOUND",
          "error": "Project not found or is not accessible with the current user.",
        },
        "headers": Headers {
          "x-stack-known-error": "PROJECT_NOT_FOUND",
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("update basic information", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId } = await Project.createProject();
    const { updateProjectResponse: response } = await Project.updateProject(projectId, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("update project basic configuration", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId } = await Project.createProject();
    const { updateProjectResponse: response } = await Project.updateProject(projectId, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("create and update project domains configuration", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId: projectId1 } = await Project.createProject();
    const { updateProjectResponse: response1 } = await Project.updateProject(projectId1, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);

    const { updateProjectResponse: response2 } = await Project.updateProject(projectId1, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
    
    // create another project and update its domain
    const { projectId: projectId2 } = await Project.createProject();
    const { updateProjectResponse: response1p2 } = await Project.updateProject(projectId2, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("create and update project email configuration", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId: projectId1 } = await Project.createProject();

    // create standard email config
    const { updateProjectResponse: response1 } = await Project.updateProject(projectId1, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);

    // create another project and update its email config
    const { projectId: projectId2 } = await Project.createProject();
    const { updateProjectResponse: response1p2 } = await Project.updateProject(projectId2, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
    
    // update standard email config again
    const { updateProjectResponse: response2 } = await Project.updateProject(projectId1, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);

    // switch back to shared email config
    const { updateProjectResponse: response3 } = await Project.updateProject(projectId1, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);

    // update to shared again
    const { updateProjectResponse: response4 } = await Project.updateProject(projectId1, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);

    // check if the second project still has the same email config
    const { updateProjectResponse: response2p2 } = await Project.updateProject(projectId2, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("update project email configuration with the wrong parameters", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId } = await Project.createProject();
    const { updateProjectResponse: response1 } = await Project.updateProject(projectId, {
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
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
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
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });

  it("update project oauth configuration", async ({ expect }) => {
    await Auth.Otp.signIn();
    const { projectId } = await Project.createProject();
    // create google oauth provider with shared type
    const { updateProjectResponse: response1 } = await Project.updateProject(projectId, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
    
    // update google oauth provider with shared type again
    const { updateProjectResponse: response2 } = await Project.updateProject(projectId, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);

    // switch to standard type
    const { updateProjectResponse: response3 } = await Project.updateProject(projectId, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);

    // add another oauth provider with invalid type
    const { updateProjectResponse: response4 } = await Project.updateProject(projectId, {
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
    
    // add another oauth provider
    const { updateProjectResponse: response5 } = await Project.updateProject(projectId, {
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
                "id": "google",
                "type": "shared",
              },
              {
                "enabled": true,
                "id": "facebook",
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
    
    // disable one of the oauth providers
    const { updateProjectResponse: response6 } = await Project.updateProject(projectId, {
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
                "enabled": false,
                "id": "google",
                "type": "shared",
              },
              {
                "enabled": true,
                "id": "facebook",
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
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <some fields may have been hidden>,
        },
      }
    `);
  });
});