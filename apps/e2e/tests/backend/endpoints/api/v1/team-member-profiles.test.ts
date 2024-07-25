import { createMailbox, it } from "../../../../helpers";
import { Auth, Team, backendContext, niceBackendFetch } from "../../../backend-helpers";

async function createTeam() {
  const { userId: userId1 } = await Auth.Otp.signIn();
  backendContext.set({ mailbox: createMailbox() });

  const { userId: userId2 } = await Auth.Otp.signIn();
  backendContext.set({ mailbox: createMailbox() });

  const { userId: userId3 } = await Auth.Otp.signIn();

  // update names of users
  await niceBackendFetch(`/api/v1/users/${userId1}`, {
    accessType: "server",
    method: "PATCH",
    body: {
      display_name: "User 1",
    },
  });

  await niceBackendFetch(`/api/v1/users/${userId2}`, {
    accessType: "server",
    method: "PATCH",
    body: {
      display_name: "User 2",
    },
  });

  await niceBackendFetch(`/api/v1/users/${userId3}`, {
    accessType: "server",
    method: "PATCH",
    body: {
      display_name: "User 3",
    },
  });

  const { teamId } = await Team.create();

  // Add members to team
  await niceBackendFetch(`/api/v1/team-memberships/${teamId}/${userId1}`, {
    accessType: "server",
    method: "POST",
    body: {},
  });
  await niceBackendFetch(`/api/v1/team-memberships/${teamId}/${userId2}`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  return { teamId, userId1, userId2, currentUserId: userId3 };
}


it("list member profiles in team", async ({ expect }) => {
  const { teamId, userId1, userId2, currentUserId } = await createTeam();


  // Does not have permission to list all members in team
  const response1 = await niceBackendFetch(`/api/v1/team-member-profiles?team_id=${teamId}`, {
    accessType: "client",
    method: "GET",
  });
  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 401,
      "body": {
        "code": "TEAM_PERMISSION_REQUIRED",
        "details": {
          "permission_id": "$read_members",
          "team_id": "<stripped UUID>",
          "user_id": "<stripped UUID>",
        },
        "error": "User <stripped UUID> does not have permission $read_members in team <stripped UUID>.",
      },
      "headers": Headers {
        "x-stack-known-error": "TEAM_PERMISSION_REQUIRED",
        <some fields may have been hidden>,
      },
    }
  `);

  // List own profile
  const response2 = await niceBackendFetch(`/api/v1/team-member-profiles?team_id=${teamId}&user_id=me`, {
    accessType: "client",
    method: "GET",
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "display_name": "User 3",
            "profile_image_url": null,
            "user_id": "<stripped UUID>",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // Grant $read_members permission
  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${currentUserId}/$read_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  // List all members in team
  const response3 = await niceBackendFetch(`/api/v1/team-member-profiles?team_id=${teamId}`, {
    accessType: "client",
    method: "GET",
  });
  expect(response3).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "display_name": "User 3",
            "profile_image_url": null,
            "user_id": "<stripped UUID>",
          },
          {
            "display_name": "User 1",
            "profile_image_url": null,
            "user_id": "<stripped UUID>",
          },
          {
            "display_name": "User 2",
            "profile_image_url": null,
            "user_id": "<stripped UUID>",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});
