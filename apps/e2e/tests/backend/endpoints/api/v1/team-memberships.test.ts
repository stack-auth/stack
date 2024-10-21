import { createMailbox, it } from "../../../../helpers";
import { ApiKey, Auth, InternalProjectKeys, Project, Team, backendContext, niceBackendFetch } from "../../../backend-helpers";


it("is not allowed to add user to team on client", async ({ expect }) => {
  const { userId: userId1 } = await Auth.Otp.signIn();
  const { teamId } = await Team.create();

  const response = await niceBackendFetch(`/api/v1/team-memberships/${teamId}/${userId1}`, {
    accessType: "client",
    method: "POST",
    body: {},
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 401,
      "body": {
        "code": "INSUFFICIENT_ACCESS_TYPE",
        "details": {
          "actual_access_type": "client",
          "allowed_access_types": [
            "server",
            "admin",
          ],
        },
        "error": "The x-stack-access-type header must be 'server' or 'admin', but was 'client'.",
      },
      "headers": Headers {
        "x-stack-known-error": "INSUFFICIENT_ACCESS_TYPE",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("creates a team and manage users on the server", async ({ expect }) => {
  const { userId: userId1 } = await Auth.Otp.signIn();
  backendContext.set({
    mailbox: createMailbox(),
  });
  const { userId: userId2 } = await Auth.Otp.signIn();
  const { teamId } = await Team.create();

  const response = await niceBackendFetch(`/api/v1/team-memberships/${teamId}/${userId1}`, {
    accessType: "server",
    method: "POST",
    body: {},
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "team_id": "<stripped UUID>",
        "user_id": "<stripped UUID>",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response2 = await niceBackendFetch(`/api/v1/users?team_id=${teamId}`, {
    accessType: "server",
    method: "GET",
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "auth_with_email": true,
            "client_metadata": null,
            "client_read_only_metadata": null,
            "display_name": null,
            "has_password": false,
            "id": "<stripped UUID>",
            "last_active_at_millis": <stripped field 'last_active_at_millis'>,
            "oauth_providers": [],
            "otp_auth_enabled": true,
            "primary_email": "<stripped UUID>@stack-generated.example.com",
            "primary_email_auth_enabled": true,
            "primary_email_verified": true,
            "profile_image_url": null,
            "requires_totp_mfa": false,
            "selected_team": null,
            "selected_team_id": null,
            "server_metadata": null,
            "signed_up_at_millis": <stripped field 'signed_up_at_millis'>,
          },
          {
            "auth_with_email": true,
            "client_metadata": null,
            "client_read_only_metadata": null,
            "display_name": null,
            "has_password": false,
            "id": "<stripped UUID>",
            "last_active_at_millis": <stripped field 'last_active_at_millis'>,
            "oauth_providers": [],
            "otp_auth_enabled": true,
            "primary_email": "<stripped UUID>@stack-generated.example.com",
            "primary_email_auth_enabled": true,
            "primary_email_verified": true,
            "profile_image_url": null,
            "requires_totp_mfa": false,
            "selected_team": null,
            "selected_team_id": null,
            "server_metadata": null,
            "signed_up_at_millis": <stripped field 'signed_up_at_millis'>,
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  // remove user from team
  const response3 = await niceBackendFetch(`/api/v1/team-memberships/${teamId}/${userId2}`, {
    accessType: "server",
    method: "DELETE",
    body: {},
  });
  expect(response3).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response4 = await niceBackendFetch(`/api/v1/users?team_id=${teamId}`, {
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
            "auth_with_email": true,
            "client_metadata": null,
            "client_read_only_metadata": null,
            "display_name": null,
            "has_password": false,
            "id": "<stripped UUID>",
            "last_active_at_millis": <stripped field 'last_active_at_millis'>,
            "oauth_providers": [],
            "otp_auth_enabled": true,
            "primary_email": "<stripped UUID>@stack-generated.example.com",
            "primary_email_auth_enabled": true,
            "primary_email_verified": true,
            "profile_image_url": null,
            "requires_totp_mfa": false,
            "selected_team": null,
            "selected_team_id": null,
            "server_metadata": null,
            "signed_up_at_millis": <stripped field 'signed_up_at_millis'>,
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("should give team creator default permissions", async ({ expect }) => {
  backendContext.set({ projectKeys: InternalProjectKeys });
  const { adminAccessToken } = await Project.createAndGetAdminToken({ config: { magic_link_enabled: true } });
  await ApiKey.createAndSetProjectKeys(adminAccessToken);

  const { userId: userId1 } = await Auth.Password.signUpWithEmail({ password: 'test1234' });
  backendContext.set({
    mailbox: createMailbox(),
  });
  const { userId: userId2 } = await Auth.Password.signUpWithEmail({ password: 'test1234' });
  const { teamId } = await Team.create();

  await niceBackendFetch(`/api/v1/team-memberships/${teamId}/${userId1}`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  const response = await niceBackendFetch(`/api/v1/team-permissions?team_id=${teamId}&user_id=${userId2}`, {
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
            "id": "admin",
            "team_id": "<stripped UUID>",
            "user_id": "<stripped UUID>",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("can leave team", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.create();

  // Does not have permission to remove user from team
  const response1 = await niceBackendFetch(`/api/v1/team-memberships/${teamId}/me`, {
    accessType: "client",
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
});

it("removes user from team on the client", async ({ expect }) => {
  const { userId: userId1 } = await Auth.Otp.signIn();
  backendContext.set({
    mailbox: createMailbox(),
  });
  const { userId: userId2 } = await Auth.Otp.signIn();
  const { teamId } = await Team.create();

  await niceBackendFetch(`/api/v1/team-memberships/${teamId}/${userId1}`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  // Does not have permission to remove user from team
  const response1 = await niceBackendFetch(`/api/v1/team-memberships/${teamId}/${userId1}`, {
    accessType: "client",
    method: "DELETE",
    body: {},
  });
  expect(response1).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 401,
      "body": {
        "code": "TEAM_PERMISSION_REQUIRED",
        "details": {
          "permission_id": "$remove_members",
          "team_id": "<stripped UUID>",
          "user_id": "<stripped UUID>",
        },
        "error": "User <stripped UUID> does not have permission $remove_members in team <stripped UUID>.",
      },
      "headers": Headers {
        "x-stack-known-error": "TEAM_PERMISSION_REQUIRED",
        <some fields may have been hidden>,
      },
    }
  `);

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${userId2}/$remove_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  // Has permission to remove user from team
  const response2 = await niceBackendFetch(`/api/v1/team-memberships/${teamId}/${userId1}`, {
    accessType: "client",
    method: "DELETE",
    body: {},
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("creates a team and not add the current user as a member on the client", async ({ expect }) => {
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
        "client_metadata": null,
        "client_read_only_metadata": null,
        "display_name": "My Team",
        "id": "<stripped UUID>",
        "profile_image_url": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response2 = await niceBackendFetch(`/api/v1/teams?user_id=me`, {
    accessType: "client",
    method: "GET",
  });
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

it("creates a team on the server and add a different user as the creator", async ({ expect }) => {
  const user1Mailbox = createMailbox();
  backendContext.set({ mailbox: user1Mailbox });
  const { userId: userId1 } = await Auth.Otp.signIn();
  backendContext.set({ mailbox: createMailbox() });
  await Auth.Otp.signIn();

  const response = await niceBackendFetch("/api/v1/teams", {
    accessType: "server",
    method: "POST",
    body: {
      display_name: "My Team",
      creator_user_id: userId1,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "client_metadata": null,
        "client_read_only_metadata": null,
        "created_at_millis": <stripped field 'created_at_millis'>,
        "display_name": "My Team",
        "id": "<stripped UUID>",
        "profile_image_url": null,
        "server_metadata": null,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  backendContext.set({ mailbox: user1Mailbox });
  await Auth.Otp.signIn();

  const response2 = await niceBackendFetch(`/api/v1/teams?user_id=me`, {
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
            "client_metadata": null,
            "client_read_only_metadata": null,
            "display_name": "My Team",
            "id": "<stripped UUID>",
            "profile_image_url": null,
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("is not allowed to create a team and add a different user as the creator on the client", async ({ expect }) => {
  const { userId: userId1 } = await Auth.Otp.signIn();
  backendContext.set({ mailbox: createMailbox() });
  await Auth.Otp.signIn();

  const response = await niceBackendFetch("/api/v1/teams", {
    accessType: "client",
    method: "POST",
    body: {
      display_name: "My Team",
      creator_user_id: userId1,
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 403,
      "body": "You cannot add a user to the team as the creator that is not yourself on the client.",
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});
