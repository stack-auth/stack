import { it } from "../../../../../helpers";
import { Auth, InternalProjectClientKeys, Project, backendContext, niceBackendFetch } from "../../../../backend-helpers";


it("should not have have access to the project", async ({ expect }) => {
  backendContext.set({ projectKeys: 'no-project' });
  const response1 = await niceBackendFetch("/api/v1/internal/projects", { accessType: "client" });
  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "ACCESS_TYPE_WITHOUT_PROJECT_ID",
        "details": { "request_type": "client" },
        "error": "The x-stack-access-type header was 'client', but the x-stack-project-id header was not provided.\\n\\nFor more information, see the docs on REST API authentication: https://docs.stack-auth.com/rest-api/auth#authentication",
      },
      "headers": Headers {
        "x-stack-known-error": "ACCESS_TYPE_WITHOUT_PROJECT_ID",
        <some fields may have been hidden>,
      },
    }
  `);
});


it("is not allowed to list all current projects without signing in", async ({ expect }) => {
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
  backendContext.set({ projectKeys: InternalProjectClientKeys });
  await Auth.Otp.signIn();
  const result = await Project.createAndGetAdminToken({
    display_name: "Test Project",
  });
  expect(result.createProjectResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "config": {
          "allow_localhost": true,
          "auth_method_configs": [],
          "client_team_creation_enabled": false,
          "client_user_deletion_enabled": false,
          "connected_account_configs": [],
          "create_team_on_sign_up": false,
          "credential_enabled": false,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_auth_method_configs": [],
          "enabled_connected_account_configs": [],
          "enabled_oauth_provider_configs": [],
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_provider_configs": [],
          "sign_up_enabled": true,
          "team_creator_default_permissions": [{ "id": "admin" }],
          "team_member_default_permissions": [{ "id": "member" }],
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

it("creates a new project with auth method configs", async ({ expect }) => {
  backendContext.set({ projectKeys: InternalProjectClientKeys });
  await Auth.Otp.signIn();
  const { createProjectResponse: response } = await Project.create({
    display_name: "Test Project",
    description: "Test description",
    is_production_mode: true,
    config: {
      allow_localhost: false,
      sign_up_enabled: false,
      auth_method_configs: [
        {
          id: crypto.randomUUID(),
          type: 'otp',
          enabled: true,
        },
        {
          id: crypto.randomUUID(),
          type: 'password',
          enabled: false,
        }
      ]
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "config": {
          "allow_localhost": false,
          "auth_method_configs": [
            {
              "enabled": true,
              "id": "<stripped UUID>",
              "type": "otp",
            },
            {
              "enabled": false,
              "id": "<stripped UUID>",
              "type": "password",
            },
          ],
          "client_team_creation_enabled": false,
          "client_user_deletion_enabled": false,
          "connected_account_configs": [],
          "create_team_on_sign_up": false,
          "credential_enabled": false,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_auth_method_configs": [
            {
              "enabled": true,
              "id": "<stripped UUID>",
              "type": "otp",
            },
          ],
          "enabled_connected_account_configs": [],
          "enabled_oauth_provider_configs": [],
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": true,
          "oauth_provider_configs": [],
          "sign_up_enabled": false,
          "team_creator_default_permissions": [{ "id": "admin" }],
          "team_member_default_permissions": [{ "id": "member" }],
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
});

it("creates a new project with oauth providers", async ({ expect }) => {
  backendContext.set({ projectKeys: InternalProjectClientKeys });
  await Auth.Otp.signIn();
  const { createProjectResponse: response } = await Project.create({
    display_name: "Test Project",
    config: {
      oauth_provider_configs: [
        {
          id: crypto.randomUUID(),
          shared: true,
          type: "google",
        },
        {
          id: crypto.randomUUID(),
          shared: false,
          type: "spotify",
          client_id: "client_id",
          client_secret: "client_secret",
        }
      ]
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "config": {
          "allow_localhost": true,
          "auth_method_configs": [],
          "client_team_creation_enabled": false,
          "client_user_deletion_enabled": false,
          "connected_account_configs": [],
          "create_team_on_sign_up": false,
          "credential_enabled": false,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_auth_method_configs": [],
          "enabled_connected_account_configs": [],
          "enabled_oauth_provider_configs": [],
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_provider_configs": [
            {
              "id": "<stripped UUID>",
              "shared": true,
              "type": "google",
            },
            {
              "client_id": "client_id",
              "client_secret": "client_secret",
              "id": "<stripped UUID>",
              "shared": false,
              "type": "spotify",
            },
          ],
          "sign_up_enabled": true,
          "team_creator_default_permissions": [{ "id": "admin" }],
          "team_member_default_permissions": [{ "id": "member" }],
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

it("creates a new project with shared email config", async ({ expect }) => {
  backendContext.set({ projectKeys: InternalProjectClientKeys });
  await Auth.Otp.signIn();
  const { createProjectResponse: response } = await Project.create({
    display_name: "Test Project",
    config: {
      email_config: {
        type: "shared",
      },
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "config": {
          "allow_localhost": true,
          "auth_method_configs": [],
          "client_team_creation_enabled": false,
          "client_user_deletion_enabled": false,
          "connected_account_configs": [],
          "create_team_on_sign_up": false,
          "credential_enabled": false,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_auth_method_configs": [],
          "enabled_connected_account_configs": [],
          "enabled_oauth_provider_configs": [],
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_provider_configs": [],
          "sign_up_enabled": true,
          "team_creator_default_permissions": [{ "id": "admin" }],
          "team_member_default_permissions": [{ "id": "member" }],
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

it("creates a new project with standard email config", async ({ expect }) => {
  backendContext.set({ projectKeys: InternalProjectClientKeys });
  await Auth.Otp.signIn();
  const { createProjectResponse: response } = await Project.create({
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
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "config": {
          "allow_localhost": true,
          "auth_method_configs": [],
          "client_team_creation_enabled": false,
          "client_user_deletion_enabled": false,
          "connected_account_configs": [],
          "create_team_on_sign_up": false,
          "credential_enabled": false,
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
          "enabled_auth_method_configs": [],
          "enabled_connected_account_configs": [],
          "enabled_oauth_provider_configs": [],
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_provider_configs": [],
          "sign_up_enabled": true,
          "team_creator_default_permissions": [{ "id": "admin" }],
          "team_member_default_permissions": [{ "id": "member" }],
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

it("creates a new project with domains", async ({ expect }) => {
  backendContext.set({ projectKeys: InternalProjectClientKeys });
  await Auth.Otp.signIn();
  const { createProjectResponse: response } = await Project.create({
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
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "config": {
          "allow_localhost": true,
          "auth_method_configs": [],
          "client_team_creation_enabled": false,
          "client_user_deletion_enabled": false,
          "connected_account_configs": [],
          "create_team_on_sign_up": false,
          "credential_enabled": false,
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
          "enabled_auth_method_configs": [],
          "enabled_connected_account_configs": [],
          "enabled_oauth_provider_configs": [],
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_provider_configs": [],
          "sign_up_enabled": true,
          "team_creator_default_permissions": [{ "id": "admin" }],
          "team_member_default_permissions": [{ "id": "member" }],
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
              "auth_method_configs": [],
              "client_team_creation_enabled": false,
              "client_user_deletion_enabled": false,
              "connected_account_configs": [],
              "create_team_on_sign_up": false,
              "credential_enabled": false,
              "domains": [],
              "email_config": { "type": "shared" },
              "enabled_auth_method_configs": [],
              "enabled_connected_account_configs": [],
              "enabled_oauth_provider_configs": [],
              "enabled_oauth_providers": [],
              "id": "<stripped UUID>",
              "magic_link_enabled": false,
              "oauth_provider_configs": [],
              "sign_up_enabled": true,
              "team_creator_default_permissions": [{ "id": "admin" }],
              "team_member_default_permissions": [{ "id": "member" }],
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
