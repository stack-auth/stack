import { wait } from "@stackframe/stack-shared/dist/utils/promises";
import { it } from "../../../../helpers";
import { ApiKey, Auth, Project, Team, Webhook, bumpEmailAddress, niceBackendFetch } from "../../../backend-helpers";


it("is not allowed to list all the teams in a project on the client", async ({ expect }) => {
  await Auth.Otp.signIn();
  const response = await niceBackendFetch("/api/v1/teams", { accessType: "client" });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 403,
      "body": "Client can only list teams for their own user. user_id must be either \\"me\\" or the ID of the current user",
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("lists all the teams in a project with server access", async ({ expect }) => {
  await Auth.Otp.signIn();
  const response = await niceBackendFetch("/api/v1/teams", { accessType: "server" });
  expect(response).toMatchObject({
    status: 200,
    body: {
      items: expect.any(Array),
      is_paginated: false,
    },
    headers: expect.anything(),
  });
});

it("lists all the teams the current user has on the client", async ({ expect }) => {
  const { userId } = await Auth.Otp.signIn();
  const response1 = await niceBackendFetch("/api/v1/teams?user_id=me", { accessType: "client" });
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

  const response2 = await niceBackendFetch(`/api/v1/teams?user_id=${userId}`, { accessType: "client" });
  expect(response2).toMatchInlineSnapshot(`
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

it("lists all the teams the current user has on the server", async ({ expect }) => {
  const { userId } = await Auth.Otp.signIn();
  const response1 = await niceBackendFetch("/api/v1/teams?user_id=me", { accessType: "server" });
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

  const response2 = await niceBackendFetch(`/api/v1/teams?user_id=${userId}`, { accessType: "server" });
  expect(response2).toMatchInlineSnapshot(`
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

it("creates a team on the client", async ({ expect }) => {
  await Auth.Otp.signIn();
  await Team.createAndAddCurrent();
});

it("does not allow creating a team when not signed in", async ({ expect }) => {
  const { userId } = await Auth.Otp.signIn();
  await Auth.signOut();
  const response = await niceBackendFetch("/api/v1/teams", {
    accessType: "client",
    method: "POST",
    body: {
      display_name: "New Team",
      creator_user_id: userId,
    },
  });
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

it("does not allow creating teams on the client for a different creator", async ({ expect }) => {
  const { userId: userId1 } = await Auth.Otp.signIn();
  await bumpEmailAddress();
  await Auth.Otp.signIn();
  const response = await niceBackendFetch("/api/v1/teams", {
    accessType: "client",
    method: "POST",
    body: {
      display_name: "New Team",
      creator_user_id: userId1,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 403,
      "body": "You cannot create a team as a user that is not yourself. Make sure you set the creator_user_id to 'me'.",
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("creates a team on the server", async ({ expect }) => {
  await Auth.Otp.signIn();
  await Team.createAndAddCurrent({ accessType: "server" });
});

it("creates a team on the server without a creator", async ({ expect }) => {
  await Auth.Otp.signIn();
  await Team.create({ accessType: "server" });
});

it("creates a team with a specific creator user id", async ({ expect }) => {
  const { userId } = await Auth.Otp.signIn();
  await Team.create({ accessType: "server", creatorUserId: userId });
});

it("does not create a team when the creator user id does not exist", async ({ expect }) => {
  await Auth.Otp.signIn();
  const response = await niceBackendFetch("/api/v1/teams", {
    accessType: "server",
    method: "POST",
    body: {
      display_name: "New Team",
      creator_user_id: "12345678-1234-4234-9234-123456789012",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 404,
      "body": {
        "code": "USER_NOT_FOUND",
        "error": "User not found.",
      },
      "headers": Headers {
        "x-stack-known-error": "USER_NOT_FOUND",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("gets a specific team on the client", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { createTeamResponse: response, teamId } = await Team.createAndAddCurrent();
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "client_metadata": null,
        "client_read_only_metadata": null,
        "created_at_millis": <stripped field 'created_at_millis'>,
        "display_name": "New Team",
        "id": "<stripped UUID>",
        "profile_image_url": null,
        "server_metadata": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response2 = await niceBackendFetch(`/api/v1/teams/${teamId}`, { accessType: "client" });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "client_metadata": null,
        "client_read_only_metadata": null,
        "display_name": "New Team",
        "id": "<stripped UUID>",
        "profile_image_url": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("gets a specific team that the user is not part of on the client", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { createTeamResponse: response, teamId } = await Team.createAndAddCurrent();

  await bumpEmailAddress();
  await Auth.Otp.signIn();

  const response2 = await niceBackendFetch(`/api/v1/teams/${teamId}`, { accessType: "client" });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 404,
      "body": {
        "code": "TEAM_MEMBERSHIP_NOT_FOUND",
        "details": {
          "team_id": "<stripped UUID>",
          "user_id": "<stripped UUID>",
        },
        "error": "User <stripped UUID> is not found in team <stripped UUID>.",
      },
      "headers": Headers {
        "x-stack-known-error": "TEAM_MEMBERSHIP_NOT_FOUND",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("gets a team that the user is not part of on the server", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  await bumpEmailAddress();

  await Auth.Otp.signIn();
  const { createTeamResponse: response } = await Team.createAndAddCurrent();
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "client_metadata": null,
        "client_read_only_metadata": null,
        "created_at_millis": <stripped field 'created_at_millis'>,
        "display_name": "New Team",
        "id": "<stripped UUID>",
        "profile_image_url": null,
        "server_metadata": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response3 = await niceBackendFetch(`/api/v1/teams/${teamId}`, { accessType: "server" });
  expect(response3).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "client_metadata": null,
        "client_read_only_metadata": null,
        "created_at_millis": <stripped field 'created_at_millis'>,
        "display_name": "New Team",
        "id": "<stripped UUID>",
        "profile_image_url": null,
        "server_metadata": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should not be allowed to get a team that the user is not part of on the client", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  await bumpEmailAddress();

  await Auth.Otp.signIn();
  const { createTeamResponse: response } = await Team.createAndAddCurrent();
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "client_metadata": null,
        "client_read_only_metadata": null,
        "created_at_millis": <stripped field 'created_at_millis'>,
        "display_name": "New Team",
        "id": "<stripped UUID>",
        "profile_image_url": null,
        "server_metadata": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response3 = await niceBackendFetch(`/api/v1/teams/${teamId}`, { accessType: "client" });
  expect(response3).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 404,
      "body": {
        "code": "TEAM_MEMBERSHIP_NOT_FOUND",
        "details": {
          "team_id": "<stripped UUID>",
          "user_id": "<stripped UUID>",
        },
        "error": "User <stripped UUID> is not found in team <stripped UUID>.",
      },
      "headers": Headers {
        "x-stack-known-error": "TEAM_MEMBERSHIP_NOT_FOUND",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("updates a team on the client", async ({ expect }) => {
  const { userId } = await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  // grant permission to update a team
  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${userId}/$update_team`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  // Has permission to update a team
  const response2 = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    accessType: "client",
    method: "PATCH",
    body: {
      display_name: "My Updated Team",
    },
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "client_metadata": null,
        "client_read_only_metadata": null,
        "display_name": "My Updated Team",
        "id": "<stripped UUID>",
        "profile_image_url": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("can set a team's display name to the empty string", async ({ expect }) => {
  const { userId } = await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  // grant permission to update a team
  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${userId}/$update_team`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  // Has permission to update a team
  const response2 = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    accessType: "client",
    method: "PATCH",
    body: {
      display_name: "",
    },
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "client_metadata": null,
        "client_read_only_metadata": null,
        "display_name": "",
        "id": "<stripped UUID>",
        "profile_image_url": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("updates team client metadata on the client", async ({ expect }) => {
  const { userId } = await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  // grant permission to update a team
  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${userId}/$update_team`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  // Has permission to update a team
  const response2 = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    accessType: "client",
    method: "PATCH",
    body: {
      client_metadata: {
        test: "test-value"
      },
    },
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "client_metadata": { "test": "test-value" },
        "client_read_only_metadata": null,
        "display_name": "New Team",
        "id": "<stripped UUID>",
        "profile_image_url": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should not be able to update team client read only metadata on the client", async ({ expect }) => {
  const { userId } = await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  // grant permission to update a team
  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${userId}/$update_team`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  // Has permission to update a team
  const response2 = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    accessType: "client",
    method: "PATCH",
    body: {
      client_read_only_metadata: {
        test: "test-value"
      },
    },
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "SCHEMA_ERROR",
        "details": {
          "message": deindent\`
            Request validation failed on PATCH /api/v1/teams/<stripped UUID>:
              - body contains unknown properties: client_read_only_metadata
          \`,
        },
        "error": deindent\`
          Request validation failed on PATCH /api/v1/teams/<stripped UUID>:
            - body contains unknown properties: client_read_only_metadata
        \`,
      },
      "headers": Headers {
        "x-stack-known-error": "SCHEMA_ERROR",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should not update a team without permission on the client", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  // Does not have permission to update a team
  const response1 = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    accessType: "client",
    method: "PATCH",
    body: {
      display_name: "My Updated Team",
    },
  });
  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 401,
      "body": {
        "code": "TEAM_PERMISSION_REQUIRED",
        "details": {
          "permission_id": "$update_team",
          "team_id": "<stripped UUID>",
          "user_id": "<stripped UUID>",
        },
        "error": "User <stripped UUID> does not have permission $update_team in team <stripped UUID>.",
      },
      "headers": Headers {
        "x-stack-known-error": "TEAM_PERMISSION_REQUIRED",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("updates a team on the server", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent({ accessType: "server" });

  const response1 = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    accessType: "server",
    method: "PATCH",
    body: {
      display_name: "My Updated Team",
      profile_image_url: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
      server_metadata: {
        "test": "test-value"
      },
    },
  });
  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "client_metadata": null,
        "client_read_only_metadata": null,
        "created_at_millis": <stripped field 'created_at_millis'>,
        "display_name": "My Updated Team",
        "id": "<stripped UUID>",
        "profile_image_url": "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
        "server_metadata": { "test": "test-value" },
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response2 = await niceBackendFetch("/api/v1/teams?user_id=me", { accessType: "server" });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "client_metadata": null,
            "client_read_only_metadata": null,
            "created_at_millis": <stripped field 'created_at_millis'>,
            "display_name": "My Updated Team",
            "id": "<stripped UUID>",
            "profile_image_url": "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
            "server_metadata": { "test": "test-value" },
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("updates team client read only metadata on the server", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent({ accessType: "server" });

  const response1 = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    accessType: "server",
    method: "PATCH",
    body: {
      client_read_only_metadata: {
        test: "test-value"
      },
    },
  });
  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "client_metadata": null,
        "client_read_only_metadata": { "test": "test-value" },
        "created_at_millis": <stripped field 'created_at_millis'>,
        "display_name": "New Team",
        "id": "<stripped UUID>",
        "profile_image_url": null,
        "server_metadata": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // check on the client
  const response2 = await niceBackendFetch(`/api/v1/teams/${teamId}`, { accessType: "client" });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "client_metadata": null,
        "client_read_only_metadata": { "test": "test-value" },
        "display_name": "New Team",
        "id": "<stripped UUID>",
        "profile_image_url": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("deletes a team on the client", async ({ expect }) => {
  const { userId } = await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  // grant permission to delete a team
  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${userId}/$delete_team`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  // Has permission to delete a team
  const response2 = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    accessType: "client",
    method: "DELETE",
    body: {
      display_name: "My Updated Team",
    },
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should not update a team without permission on the client", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  // Does not have permission to delete a team
  const response1 = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    accessType: "client",
    method: "DELETE",
    body: {
      display_name: "My Updated Team",
    },
  });
  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 401,
      "body": {
        "code": "TEAM_PERMISSION_REQUIRED",
        "details": {
          "permission_id": "$delete_team",
          "team_id": "<stripped UUID>",
          "user_id": "<stripped UUID>",
        },
        "error": "User <stripped UUID> does not have permission $delete_team in team <stripped UUID>.",
      },
      "headers": Headers {
        "x-stack-known-error": "TEAM_PERMISSION_REQUIRED",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("deletes a team on the server", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent({ accessType: "server" });

  const response1 = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    accessType: "server",
    method: "DELETE",
    body: {},
  });
  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response2 = await niceBackendFetch("/api/v1/teams?user_id=me", { accessType: "server" });
  expect(response2).toMatchInlineSnapshot(`
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

it("enables create team on sign up", async ({ expect }) => {
  const { adminAccessToken } = await Project.createAndGetAdminToken();
  const response = await niceBackendFetch("/api/v1/projects/current", {
    accessType: "admin",
    method: "PATCH",
    body: {
      config: {
        create_team_on_sign_up: true,
        magic_link_enabled: true,
      }
    },
    headers: {
      "x-stack-admin-access-token": adminAccessToken,
    },
  });

  expect(response.body.config.create_team_on_sign_up).toBe(true);

  await ApiKey.createAndSetProjectKeys(adminAccessToken);

  await bumpEmailAddress();
  await Auth.Otp.signIn();

  const response2 = await niceBackendFetch("/api/v1/teams?user_id=me", { accessType: "server" });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "client_metadata": null,
            "client_read_only_metadata": null,
            "created_at_millis": <stripped field 'created_at_millis'>,
            "display_name": "mailbox-1--<stripped UUID>@stack-generated.example.com's Team",
            "id": "<stripped UUID>",
            "profile_image_url": null,
            "server_metadata": null,
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should trigger team webhook when a team is created", async ({ expect }) => {
  const { projectId, svixToken, endpointId } = await Webhook.createProjectWithEndpoint();

  const createTeamResponse = await niceBackendFetch("/api/v1/teams", {
    method: "POST",
    accessType: "server",
    body: {
      display_name: "Test Team"
    }
  });
  expect(createTeamResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "client_metadata": null,
        "client_read_only_metadata": null,
        "created_at_millis": <stripped field 'created_at_millis'>,
        "display_name": "Test Team",
        "id": "<stripped UUID>",
        "profile_image_url": null,
        "server_metadata": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  await wait(1000);

  const attemptResponse = await Webhook.listWebhookAttempts(projectId, endpointId, svixToken);

  expect(attemptResponse).toMatchInlineSnapshot(`
    [
      {
        "channels": null,
        "eventId": null,
        "eventType": "team.created",
        "id": "<stripped svix message id>",
        "payload": {
          "data": {
            "client_metadata": null,
            "client_read_only_metadata": null,
            "created_at_millis": <stripped field 'created_at_millis'>,
            "display_name": "Test Team",
            "id": "<stripped UUID>",
            "profile_image_url": null,
            "server_metadata": null,
          },
          "type": "team.created",
        },
        "timestamp": <stripped field 'timestamp'>,
      },
    ]
  `);
});

it("should trigger team webhook when a team is updated", async ({ expect }) => {
  const { projectId, svixToken, endpointId } = await Webhook.createProjectWithEndpoint();

  const createTeamResponse = await niceBackendFetch("/api/v1/teams", {
    method: "POST",
    accessType: "server",
    body: {
      display_name: "Test Team"
    }
  });

  expect(createTeamResponse.status).toBe(201);
  const teamId = createTeamResponse.body.id;

  const updateTeamResponse = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    method: "PATCH",
    accessType: "server",
    body: {
      display_name: "Updated Team Name"
    }
  });

  expect(updateTeamResponse.status).toBe(200);

  await wait(1000);

  const attemptResponse = await Webhook.listWebhookAttempts(projectId, endpointId, svixToken);

  expect(attemptResponse).toMatchInlineSnapshot(`
    [
      {
        "channels": null,
        "eventId": null,
        "eventType": "team.updated",
        "id": "<stripped svix message id>",
        "payload": {
          "data": {
            "client_metadata": null,
            "client_read_only_metadata": null,
            "created_at_millis": <stripped field 'created_at_millis'>,
            "display_name": "Updated Team Name",
            "id": "<stripped UUID>",
            "profile_image_url": null,
            "server_metadata": null,
          },
          "type": "team.updated",
        },
        "timestamp": <stripped field 'timestamp'>,
      },
      {
        "channels": null,
        "eventId": null,
        "eventType": "team.created",
        "id": "<stripped svix message id>",
        "payload": {
          "data": {
            "client_metadata": null,
            "client_read_only_metadata": null,
            "created_at_millis": <stripped field 'created_at_millis'>,
            "display_name": "Test Team",
            "id": "<stripped UUID>",
            "profile_image_url": null,
            "server_metadata": null,
          },
          "type": "team.created",
        },
        "timestamp": <stripped field 'timestamp'>,
      },
    ]
  `);
});

it("should trigger team webhook when a team is deleted", async ({ expect }) => {
  const { projectId, svixToken, endpointId } = await Webhook.createProjectWithEndpoint();

  const createTeamResponse = await niceBackendFetch("/api/v1/teams", {
    method: "POST",
    accessType: "server",
    body: {
      display_name: "Test Team"
    }
  });

  expect(createTeamResponse.status).toBe(201);
  const teamId = createTeamResponse.body.id;

  const deleteTeamResponse = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    method: "DELETE",
    accessType: "server"
  });

  expect(deleteTeamResponse.status).toBe(200);

  await wait(1000);

  const attemptResponse = await Webhook.listWebhookAttempts(projectId, endpointId, svixToken);

  expect(attemptResponse).toMatchInlineSnapshot(`
    [
      {
        "channels": null,
        "eventId": null,
        "eventType": "team.deleted",
        "id": "<stripped svix message id>",
        "payload": {
          "data": { "id": "<stripped UUID>" },
          "type": "team.deleted",
        },
        "timestamp": <stripped field 'timestamp'>,
      },
      {
        "channels": null,
        "eventId": null,
        "eventType": "team.created",
        "id": "<stripped svix message id>",
        "payload": {
          "data": {
            "client_metadata": null,
            "client_read_only_metadata": null,
            "created_at_millis": <stripped field 'created_at_millis'>,
            "display_name": "Test Team",
            "id": "<stripped UUID>",
            "profile_image_url": null,
            "server_metadata": null,
          },
          "type": "team.created",
        },
        "timestamp": <stripped field 'timestamp'>,
      },
    ]
  `);
});
