import { it } from "../../../../helpers";
import { ApiKey, InternalProjectKeys, Project, backendContext, niceBackendFetch } from "../../../backend-helpers";


it("lists all the team permissions", async ({ expect }) => {
  backendContext.set({
    projectKeys: InternalProjectKeys,
  });
  const { adminAccessToken } = await Project.createAndSetAdmin();
  await ApiKey.createAndSetProjectKeys(adminAccessToken);

  const response = await niceBackendFetch(`/api/v1/team-permission-definitions`, {
    accessType: "server",
    method: "GET",
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "__database_id": "<stripped UUID>",
            "contained_permission_ids": [
              "$update_team",
              "$delete_team",
              "$read_members",
              "$remove_members",
              "$invite_members",
            ],
            "description": "Default permission for team creators",
            "id": "admin",
          },
          {
            "__database_id": "<stripped UUID>",
            "contained_permission_ids": [
              "$read_members",
              "$invite_members",
            ],
            "description": "Default permission for team members",
            "id": "member",
          },
          {
            "__database_id": "$update_team",
            "contained_permission_ids": [],
            "description": "Update the team information",
            "id": "$update_team",
          },
          {
            "__database_id": "$delete_team",
            "contained_permission_ids": [],
            "description": "Delete the team",
            "id": "$delete_team",
          },
          {
            "__database_id": "$read_members",
            "contained_permission_ids": [],
            "description": "Read and list the other members of the team",
            "id": "$read_members",
          },
          {
            "__database_id": "$remove_members",
            "contained_permission_ids": [],
            "description": "Remove other members from the team",
            "id": "$remove_members",
          },
          {
            "__database_id": "$invite_members",
            "contained_permission_ids": [],
            "description": "Invite other users to the team",
            "id": "$invite_members",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("creates, updates, and delete a new team permission", async ({ expect }) => {
  backendContext.set({ projectKeys: InternalProjectKeys });
  const { adminAccessToken } = await Project.createAndSetAdmin();
  await ApiKey.createAndSetProjectKeys(adminAccessToken);

  const response1 = await niceBackendFetch(`/api/v1/team-permission-definitions`, {
    accessType: "server",
    method: "POST",
    body: {
      id: 'p1'
    }
  });
  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "__database_id": "<stripped UUID>",
        "contained_permission_ids": [],
        "id": "p1",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // create another permission with contained permissions
  const response2 = await niceBackendFetch(`/api/v1/team-permission-definitions`, {
    accessType: "server",
    method: "POST",
    body: {
      id: 'p2',
      contained_permission_ids: ['p1', '$read_members']
    }
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "__database_id": "<stripped UUID>",
        "contained_permission_ids": [
          "$read_members",
          "p1",
        ],
        "id": "p2",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // update the permission
  const response3 = await niceBackendFetch(`/api/v1/team-permission-definitions/p2`, {
    accessType: "server",
    method: "PATCH",
    body: {
      id: 'p3',
      contained_permission_ids: ['p1', '$update_team']
    }
  });

  expect(response3).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "__database_id": "<stripped UUID>",
        "contained_permission_ids": [
          "$update_team",
          "p1",
        ],
        "id": "p3",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // list all permissions again
  const response4 = await niceBackendFetch(`/api/v1/team-permission-definitions`, {
    accessType: "server",
    method: "GET",
  });
  expect(response4).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "__database_id": "<stripped UUID>",
            "contained_permission_ids": [
              "$update_team",
              "$delete_team",
              "$read_members",
              "$remove_members",
              "$invite_members",
            ],
            "description": "Default permission for team creators",
            "id": "admin",
          },
          {
            "__database_id": "<stripped UUID>",
            "contained_permission_ids": [
              "$read_members",
              "$invite_members",
            ],
            "description": "Default permission for team members",
            "id": "member",
          },
          {
            "__database_id": "<stripped UUID>",
            "contained_permission_ids": [],
            "id": "p1",
          },
          {
            "__database_id": "<stripped UUID>",
            "contained_permission_ids": [
              "$update_team",
              "p1",
            ],
            "id": "p3",
          },
          {
            "__database_id": "$update_team",
            "contained_permission_ids": [],
            "description": "Update the team information",
            "id": "$update_team",
          },
          {
            "__database_id": "$delete_team",
            "contained_permission_ids": [],
            "description": "Delete the team",
            "id": "$delete_team",
          },
          {
            "__database_id": "$read_members",
            "contained_permission_ids": [],
            "description": "Read and list the other members of the team",
            "id": "$read_members",
          },
          {
            "__database_id": "$remove_members",
            "contained_permission_ids": [],
            "description": "Remove other members from the team",
            "id": "$remove_members",
          },
          {
            "__database_id": "$invite_members",
            "contained_permission_ids": [],
            "description": "Invite other users to the team",
            "id": "$invite_members",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // delete the permission
  const response5 = await niceBackendFetch(`/api/v1/team-permission-definitions/p1`, {
    accessType: "server",
    method: "DELETE",
  });
  expect(response5).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // list all permissions again
  const response6 = await niceBackendFetch(`/api/v1/team-permission-definitions`, {
    accessType: "server",
    method: "GET",
  });
  expect(response6).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "__database_id": "<stripped UUID>",
            "contained_permission_ids": [
              "$update_team",
              "$delete_team",
              "$read_members",
              "$remove_members",
              "$invite_members",
            ],
            "description": "Default permission for team creators",
            "id": "admin",
          },
          {
            "__database_id": "<stripped UUID>",
            "contained_permission_ids": [
              "$read_members",
              "$invite_members",
            ],
            "description": "Default permission for team members",
            "id": "member",
          },
          {
            "__database_id": "<stripped UUID>",
            "contained_permission_ids": ["$update_team"],
            "id": "p3",
          },
          {
            "__database_id": "$update_team",
            "contained_permission_ids": [],
            "description": "Update the team information",
            "id": "$update_team",
          },
          {
            "__database_id": "$delete_team",
            "contained_permission_ids": [],
            "description": "Delete the team",
            "id": "$delete_team",
          },
          {
            "__database_id": "$read_members",
            "contained_permission_ids": [],
            "description": "Read and list the other members of the team",
            "id": "$read_members",
          },
          {
            "__database_id": "$remove_members",
            "contained_permission_ids": [],
            "description": "Remove other members from the team",
            "id": "$remove_members",
          },
          {
            "__database_id": "$invite_members",
            "contained_permission_ids": [],
            "description": "Invite other users to the team",
            "id": "$invite_members",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});
