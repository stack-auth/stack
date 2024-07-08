import { it } from "../../../../helpers";
import { Auth, Team, niceBackendFetch } from "../../../backend-helpers";


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

it("grant non-existing permission to a user in a team on the server", async ({ expect }) => {
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

