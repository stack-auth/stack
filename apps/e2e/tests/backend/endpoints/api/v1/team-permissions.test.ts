import { it } from "../../../../helpers";
import { ApiKey, Auth, InternalProjectKeys, Project, Team, backendContext, niceBackendFetch } from "../../../backend-helpers";


it("lists all the permissions the current user have in a team on the server", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.create();

  const response = await niceBackendFetch(`/api/v1/team-permissions?team_id=${teamId}`, { 
    accessType: "server",
    method: "GET",
  });
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

it("lists all the permissions the current user have in a team on the client", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.create();

  const response = await niceBackendFetch(`/api/v1/team-permissions?team_id=${teamId}&user_id=me`, { 
    accessType: "client",
    method: "GET",
  });
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

it("is not allowed to list permissions from the other users on the client", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.create();

  const response = await niceBackendFetch(`/api/v1/team-permissions?team_id=${teamId}`, { 
    accessType: "client",
    method: "GET",
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": "Client can only list permissions for their own user. user_id must be either \\"me\\" or the ID of the current user",
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("grant non-existing permission to a user on the server", async ({ expect }) => {
  const { userId } = await Auth.Otp.signIn();
  const { teamId } = await Team.create();

  const response = await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${userId}/not-exist`, { 
    accessType: "server",
    method: "POST",
    body: {},
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 404,
      "body": {
        "code": "PERMISSION_NOT_FOUND",
        "details": { "permission_id": "not-exist" },
        "error": "Permission \\"not-exist\\" not found. Make sure you created it on the dashboard.",
      },
      "headers": Headers {
        "x-stack-known-error": "PERMISSION_NOT_FOUND",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("create a new permission and grant it to a user on the server", async ({ expect }) => {
  backendContext.set({ projectKeys: InternalProjectKeys });
  const { adminAccessToken } = await Project.createAndSetAdmin();
  await ApiKey.createAndSetProjectKeys(adminAccessToken);

  // create a permission child
  await niceBackendFetch(`/api/v1/team-permission-definitions`, { 
    accessType: "server",
    method: "POST",
    body: {
      id: 'child',
      description: 'Child permission',
    },
  });

  // create a permission parent
  await niceBackendFetch(`/api/v1/team-permission-definitions`, { 
    accessType: "server",
    method: "POST",
    body: {
      id: 'parent',
      description: 'Parent permission',
      contained_permission_ids: ['child'],
    },
  });

  const { userId } = await Auth.Password.signUpWithEmail({ password: 'test1234' });
  const { teamId } = await Team.create();

  // list current permissions (should be empty)
  const response1 = await niceBackendFetch(`/api/v1/team-permissions?team_id=${teamId}&user_id=me`, { 
    accessType: "client",
    method: "GET",
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

  // grant new permission
  const response2 = await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${userId}/parent`, { 
    accessType: "server",
    method: "POST",
    body: {},
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": { "id": "parent" },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // list current permissions (should have the new permission)
  const response3 = await niceBackendFetch(`/api/v1/team-permissions?team_id=${teamId}&user_id=me`, { 
    accessType: "client",
    method: "GET",
  });
  expect(response3).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [{ "id": "parent" }],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

