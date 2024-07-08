import { it } from "../../../../helpers";
import { Auth, Team, niceBackendFetch } from "../../../backend-helpers";


it("is not allowed to list all the teams in a project on the client", async ({ expect }) => {
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
  const { createTeamResponse: response } = await Team.create();
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "display_name": "New Team",
        "id": "<stripped UUID>",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("creates a team on the server", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { createTeamResponse: response } = await Team.create({ accessType: "server" });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "created_at_millis": <stripped field 'created_at_millis'>,
        "display_name": "New Team",
        "id": "<stripped UUID>",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it.todo("updates a team on the client");

it("updates a team on the server", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.create({ accessType: "server" });

  const response1 = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    accessType: "server",
    method: "PATCH",
    body: {
      display_name: "My Updated Team",
    },
  });
  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "created_at_millis": <stripped field 'created_at_millis'>,
        "display_name": "My Updated Team",
        "id": "<stripped UUID>",
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
            "created_at_millis": <stripped field 'created_at_millis'>,
            "display_name": "My Updated Team",
            "id": "<stripped UUID>",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it.todo("delete a team on the client");

it("deletes a team on the server", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.create({ accessType: "server" });

  const response1 = await niceBackendFetch(`/api/v1/teams/${teamId}`, {
    accessType: "server",
    method: "DELETE",
    body: {},
  });
  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
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