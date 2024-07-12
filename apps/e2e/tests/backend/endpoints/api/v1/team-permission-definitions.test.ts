import { it } from "../../../../helpers";
import { ApiKey, Auth, InternalProjectKeys, Project, Team, backendContext, niceBackendFetch } from "../../../backend-helpers";


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

it("create a new team permission", async ({ expect }) => {
  backendContext.set({
    projectKeys: InternalProjectKeys,
  });
  const { adminAccessToken } = await Project.createAndSetAdmin();
  await ApiKey.createAndSetProjectKeys(adminAccessToken);

  const response = await niceBackendFetch(`/api/v1/team-permission-definitions`, {
    accessType: "server",
    method: "POST",
    body: {
      id: 'new_permission'
    }
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "__database_id": "<stripped UUID>",
        "contained_permission_ids": [],
        "id": "new_permission",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});
