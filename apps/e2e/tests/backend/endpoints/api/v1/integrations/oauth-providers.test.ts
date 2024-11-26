import { it } from "../../../../../helpers";
import { Auth, Project, niceBackendFetch } from "../../../../backend-helpers";


it("creates a new oauth provider", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { adminAccessToken } = await Project.createAndGetAdminToken();

  const response = await niceBackendFetch(`/api/v1/integrations/oauth-providers`, {
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

  const response1 = await niceBackendFetch(`/api/v1/integrations/oauth-providers`, {
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

  const response2 = await niceBackendFetch(`/api/v1/integrations/oauth-providers`, {
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

  const response3 = await niceBackendFetch(`/api/v1/integrations/oauth-providers`, {
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
});
