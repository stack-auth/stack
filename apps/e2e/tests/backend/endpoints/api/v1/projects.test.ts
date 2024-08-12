import { it } from "../../../../helpers";
import { Auth, InternalProjectKeys, Project, backendContext, niceBackendFetch } from "../../../backend-helpers";


it("should not have have access to the project", async ({ expect }) => {
  backendContext.set({
    projectKeys: 'no-project'
  });
  const response = await niceBackendFetch("/api/v1/projects/current", { accessType: "client" });
  expect(response).toMatchInlineSnapshot(`
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

it("gets current project (internal)", async ({ expect }) => {
  backendContext.set({
    projectKeys: InternalProjectKeys,
  });
  const response = await niceBackendFetch("/api/v1/projects/current", { accessType: "client" });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "config": {
          "client_team_creation_enabled": true,
          "credential_enabled": true,
          "enabled_oauth_providers": [
            { "id": "facebook" },
            { "id": "github" },
            { "id": "google" },
            { "id": "microsoft" },
          ],
          "magic_link_enabled": true,
          "sign_up_enabled": true,
        },
        "display_name": "Stack Dashboard",
        "id": "internal",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("creates and updates the basic project information of a project", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { adminAccessToken } = await Project.createAndGetAdminToken();
  const { updateProjectResponse: response } = await Project.updateCurrent(adminAccessToken, {
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
          "credential_enabled": true,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_providers": [],
          "sign_up_enabled": true,
          "team_creator_default_permissions": [{ "id": "admin" }],
          "team_member_default_permissions": [{ "id": "member" }],
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
  const { adminAccessToken } = await Project.createAndGetAdminToken();
  const { updateProjectResponse: response } = await Project.updateCurrent(adminAccessToken, {
    config: {
      allow_localhost: false,
      sign_up_enabled: false,
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
          "credential_enabled": false,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": true,
          "oauth_providers": [],
          "sign_up_enabled": false,
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("updates the project domains configuration", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { adminAccessToken } = await Project.createAndGetAdminToken();
  const { updateProjectResponse: response1 } = await Project.updateCurrent(adminAccessToken, {
    config: {
      domains: [{
        domain: 'https://trusted-domain.stack-test.example.com',
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
          "credential_enabled": true,
          "domains": [
            {
              "domain": "https://trusted-domain.stack-test.example.com",
              "handler_path": "/handler",
            },
          ],
          "email_config": { "type": "shared" },
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_providers": [],
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const { updateProjectResponse: response2 } = await Project.updateCurrent(adminAccessToken, {
    config: {
      domains: [
        {
          domain: 'https://trusted-domain2.stack-test.example.com',
          handler_path: '/handler'
        },
        {
          domain: 'https://trusted-domain3.stack-test.example.com',
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
          "credential_enabled": true,
          "domains": [
            {
              "domain": "https://trusted-domain2.stack-test.example.com",
              "handler_path": "/handler",
            },
            {
              "domain": "https://trusted-domain3.stack-test.example.com",
              "handler_path": "/handler2",
            },
          ],
          "email_config": { "type": "shared" },
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_providers": [],
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("updates the project email configuration", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { adminAccessToken } = await Project.createAndGetAdminToken();
  const { updateProjectResponse: response1 } = await Project.updateCurrent(adminAccessToken, {
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
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
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_providers": [],
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // update standard email config again
  const { updateProjectResponse: response2 } = await Project.updateCurrent(adminAccessToken, {
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
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
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_providers": [],
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // switch back to shared email config
  const { updateProjectResponse: response3 } = await Project.updateCurrent(adminAccessToken, {
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
          "credential_enabled": true,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_providers": [],
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // update to shared again
  const { updateProjectResponse: response4 } = await Project.updateCurrent(adminAccessToken, {
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
          "credential_enabled": true,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_providers": [],
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // check if the second project still has the same email config
  const { updateProjectResponse: response2p2 } = await Project.updateCurrent(adminAccessToken, {
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
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
          "enabled_oauth_providers": [],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_providers": [],
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("updates the project email configuration with invalid parameters", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { adminAccessToken } = await Project.createAndGetAdminToken();
  const { updateProjectResponse: response1 } = await Project.updateCurrent(adminAccessToken, {
    config: {
      email_config: {
        type: "shared",
        client_id: "client_id",
      } as any,
    },
  });
  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "SCHEMA_ERROR",
        "details": { "message": "Request validation failed on PATCH /api/v1/projects/current:\\n  - body.config.email_config contains unknown properties: client_id" },
        "error": "Request validation failed on PATCH /api/v1/projects/current:\\n  - body.config.email_config contains unknown properties: client_id",
      },
      "headers": Headers {
        "x-stack-known-error": "SCHEMA_ERROR",
        <some fields may have been hidden>,
      },
    }
  `);

  const response2 = await Project.updateCurrent(adminAccessToken, {
    config: {
      email_config: {
        type: "standard",
      },
    },
  });
  expect(response2).toMatchInlineSnapshot(`
    {
      "updateProjectResponse": NiceResponse {
        "status": 400,
        "body": {
          "code": "SCHEMA_ERROR",
          "details": { "message": "Request validation failed on PATCH /api/v1/projects/current:\\n  - body.config.email_config.host is a required field\\n  - body.config.email_config.port is a required field\\n  - body.config.email_config.username is a required field\\n  - body.config.email_config.password is a required field\\n  - body.config.email_config.sender_name is a required field\\n  - body.config.email_config.sender_email is a required field" },
          "error": "Request validation failed on PATCH /api/v1/projects/current:\\n  - body.config.email_config.host is a required field\\n  - body.config.email_config.port is a required field\\n  - body.config.email_config.username is a required field\\n  - body.config.email_config.password is a required field\\n  - body.config.email_config.sender_name is a required field\\n  - body.config.email_config.sender_email is a required field",
        },
        "headers": Headers {
          "x-stack-known-error": "SCHEMA_ERROR",
          <some fields may have been hidden>,
        },
      },
    }
  `);
});

it("updates the project oauth configuration", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { adminAccessToken } = await Project.createAndGetAdminToken();
  // create google oauth provider with shared type
  const { updateProjectResponse: response1 } = await Project.updateCurrent(adminAccessToken, {
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
          "credential_enabled": true,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_oauth_providers": [{ "id": "google" }],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_providers": [
            {
              "enabled": true,
              "id": "google",
              "type": "shared",
            },
          ],
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // update google oauth provider with shared type again
  const { updateProjectResponse: response2 } = await Project.updateCurrent(adminAccessToken, {
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
          "credential_enabled": true,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_oauth_providers": [{ "id": "google" }],
          "id": "<stripped UUID>",
          "magic_link_enabled": false,
          "oauth_providers": [
            {
              "enabled": true,
              "id": "google",
              "type": "shared",
            },
          ],
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // switch to standard type
  const { updateProjectResponse: response3 } = await Project.updateCurrent(adminAccessToken, {
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
          "credential_enabled": true,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_oauth_providers": [{ "id": "google" }],
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // add another oauth provider with invalid type
  const { updateProjectResponse: response4 } = await Project.updateCurrent(adminAccessToken, {
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
  const { updateProjectResponse: response5 } = await Project.updateCurrent(adminAccessToken, {
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
          "credential_enabled": true,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_oauth_providers": [
            { "id": "facebook" },
            { "id": "google" },
          ],
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // disable one of the oauth providers
  const { updateProjectResponse: response6 } = await Project.updateCurrent(adminAccessToken, {
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
          "client_team_creation_enabled": false,
          "create_team_on_sign_up": false,
          "credential_enabled": true,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_oauth_providers": [{ "id": "facebook" }],
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
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});
