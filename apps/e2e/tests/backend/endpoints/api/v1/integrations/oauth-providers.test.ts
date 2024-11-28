import { it } from "../../../../../helpers";
import { Auth, Project, niceBackendFetch } from "../../../../backend-helpers";


it("creates a new oauth provider", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { adminAccessToken } = await Project.createAndGetAdminToken();

  const response = await niceBackendFetch(`/api/v1/integrations/neon/oauth-providers`, {
    accessType: "admin",
    method: "POST",
    headers: {
      'x-stack-admin-access-token': adminAccessToken,
    },
    body: {
      id: "google",
      type: "shared"
    },
  });

  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "id": "google",
        "type": "shared",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("lists oauth providers", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { adminAccessToken } = await Project.createAndGetAdminToken();

  const response1 = await niceBackendFetch(`/api/v1/integrations/neon/oauth-providers`, {
    accessType: "admin",
    method: "GET",
    headers: {
      'x-stack-admin-access-token': adminAccessToken,
    },
  });

  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response2 = await niceBackendFetch(`/api/v1/integrations/neon/oauth-providers`, {
    accessType: "admin",
    method: "POST",
    headers: {
      'x-stack-admin-access-token': adminAccessToken,
    },
    body: {
      id: "google",
      type: "shared"
    },
  });

  expect(response2.status).toBe(201);

  const response3 = await niceBackendFetch(`/api/v1/integrations/neon/oauth-providers`, {
    accessType: "admin",
    method: "GET",
    headers: {
      'x-stack-admin-access-token': adminAccessToken,
    },
  });

  expect(response3).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "id": "google",
            "type": "shared",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const { updateProjectResponse } = await Project.updateCurrent(adminAccessToken, {});
  expect(updateProjectResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "config": {
          "allow_localhost": true,
          "client_team_creation_enabled": false,
          "client_user_deletion_enabled": false,
          "create_team_on_sign_up": false,
          "credential_enabled": true,
          "domains": [],
          "email_config": { "type": "shared" },
          "enabled_oauth_providers": [{ "id": "google" }],
          "id": "<stripped UUID>",
          "legacy_global_jwt_signing": false,
          "magic_link_enabled": false,
          "oauth_providers": [
            {
              "enabled": true,
              "id": "google",
              "type": "shared",
            },
          ],
          "passkey_enabled": false,
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

it("creates standard oauth providers", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { adminAccessToken } = await Project.createAndGetAdminToken();

  const response1 = await niceBackendFetch(`/api/v1/integrations/neon/oauth-providers`, {
    accessType: "admin",
    method: "POST",
    headers: {
      'x-stack-admin-access-token': adminAccessToken,
    },
    body: {
      id: "google",
      type: "standard",
      client_id: "client_id",
      client_secret: "client_secret",
    },
  });

  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "client_id": "client_id",
        "client_secret": "client_secret",
        "id": "google",
        "type": "standard",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response2 = await niceBackendFetch(`/api/v1/integrations/neon/oauth-providers`, {
    accessType: "admin",
    method: "GET",
    headers: {
      'x-stack-admin-access-token': adminAccessToken,
    },
  });

  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "client_id": "client_id",
            "client_secret": "client_secret",
            "id": "google",
            "type": "standard",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("updates shared to standard oauth provider", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { adminAccessToken } = await Project.createAndGetAdminToken();

  const response1 = await niceBackendFetch(`/api/v1/integrations/neon/oauth-providers`, {
    accessType: "admin",
    method: "POST",
    headers: {
      'x-stack-admin-access-token': adminAccessToken,
    },
    body: {
      id: "google",
      type: "shared",
    },
  });

  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "id": "google",
        "type": "shared",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response2 = await niceBackendFetch(`/api/v1/integrations/neon/oauth-providers/google`, {
    accessType: "admin",
    method: "PATCH",
    headers: {
      'x-stack-admin-access-token': adminAccessToken,
    },
    body: {
      type: "standard",
      client_id: "client_id",
      client_secret: "client_secret",
    },
  });

  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "client_id": "client_id",
        "client_secret": "client_secret",
        "id": "google",
        "type": "standard",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("deletes an oauth provider", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { adminAccessToken } = await Project.createAndGetAdminToken();

  // Create a provider first
  const createResponse = await niceBackendFetch(`/api/v1/integrations/neon/oauth-providers`, {
    accessType: "admin",
    method: "POST",
    headers: {
      'x-stack-admin-access-token': adminAccessToken,
    },
    body: {
      id: "google",
      type: "standard",
      client_id: "client_id",
      client_secret: "client_secret"
    },
  });

  expect(createResponse.status).toBe(201);

  // Delete the provider
  const deleteResponse = await niceBackendFetch(`/api/v1/integrations/neon/oauth-providers/google`, {
    accessType: "admin",
    method: "DELETE",
    headers: {
      'x-stack-admin-access-token': adminAccessToken,
    }
  });

  expect(deleteResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // Verify provider is deleted by trying to fetch it
  const getResponse = await niceBackendFetch(`/api/v1/integrations/neon/oauth-providers/google`, {
    accessType: "admin",
    method: "GET",
    headers: {
      'x-stack-admin-access-token': adminAccessToken,
    }
  });

  expect(getResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 405,
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});
