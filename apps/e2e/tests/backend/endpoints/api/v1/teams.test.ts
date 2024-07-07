import { it } from "../../../../helpers";
import { Auth, niceBackendFetch } from "../../../backend-helpers";


it("lists all the teams in a project with client access (not allowed)", async ({ expect }) => {
  await Auth.Otp.signIn();
  const response = await niceBackendFetch("/api/v1/teams", { accessType: "client" });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 403,
      "body": "You are only allowed to access your own teams with the client access token.",
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

it("lists all the teams the current user has", async ({ expect }) => {
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

it("creates a team", async ({ expect }) => {
  const { userId } = await Auth.Otp.signIn();
  const response = await niceBackendFetch("/api/v1/teams", {
    accessType: "client",
    method: "POST",
    body: {
      display_name: "My Team",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "display_name": "My Team",
        "id": "<stripped UUID>",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});