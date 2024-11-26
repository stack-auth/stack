import { createMailbox, it } from "../../../../helpers";
import { Auth, Team, backendContext, niceBackendFetch } from "../../../backend-helpers";

it("requires $invite_members permission to send invitation", async ({ expect }) => {
  await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  const sendTeamInvitationResponse = await niceBackendFetch("/api/v1/team-invitations/send-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: "some-email-test@example.com",
      team_id: teamId,
      callback_url: "http://localhost:12345/some-callback-url",
    },
  });

  expect(sendTeamInvitationResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 401,
      "body": {
        "code": "TEAM_PERMISSION_REQUIRED",
        "details": {
          "permission_id": "$invite_members",
          "team_id": "<stripped UUID>",
          "user_id": "<stripped UUID>",
        },
        "error": "User <stripped UUID> does not have permission $invite_members in team <stripped UUID>.",
      },
      "headers": Headers {
        "x-stack-known-error": "TEAM_PERMISSION_REQUIRED",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("can send invitation", async ({ expect }) => {
  const { userId: userId1 } = await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  const receiveMailbox = createMailbox();

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${userId1}/$invite_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });


  await Team.sendInvitation(receiveMailbox, teamId);

  backendContext.set({ mailbox: receiveMailbox });
  await Auth.Otp.signIn();

  await Team.acceptInvitation();

  const response = await niceBackendFetch(`/api/v1/teams?user_id=me`, {
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
            "client_metadata": null,
            "client_read_only_metadata": null,
            "created_at_millis": <stripped field 'created_at_millis'>,
            "display_name": "New Team",
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

it("can send invitation without a current user on the server", async ({ expect }) => {
  const { teamId } = await Team.create();
  const receiveMailbox = createMailbox();

  backendContext.set({ userAuth: null });
  const sendTeamInvitationResponse = await niceBackendFetch("/api/v1/team-invitations/send-code", {
    method: "POST",
    accessType: "server",
    body: {
      email: receiveMailbox.emailAddress,
      team_id: teamId,
      callback_url: "http://localhost:12345/some-callback-url",
    },
  });

  expect(sendTeamInvitationResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "id": "<stripped UUID>",
        "success": true,
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  backendContext.set({ mailbox: receiveMailbox });
  await Auth.Otp.signIn();
  await Team.acceptInvitation();

  const response = await niceBackendFetch(`/api/v1/teams?user_id=me`, {
    accessType: "server",
    method: "GET",
  });
  expect(response.body.items).toHaveLength(1);
  expect(response.body.items[0].display_name).toBe("New Team");
});


it("can list invitations on the server", async ({ expect }) => {
  const { userId: inviter } = await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${inviter}/$invite_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });
  await Team.sendInvitation("some-email-test@example.com", teamId);

  const listInvitationsResponse = await niceBackendFetch(`/api/v1/team-invitations?team_id=${teamId}`, {
    accessType: "server",
    method: "GET",
  });
  expect(listInvitationsResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "expires_at_millis": <stripped field 'expires_at_millis'>,
            "id": "<stripped UUID>",
            "recipient_email": "some-email-test@example.com",
            "team_id": "<stripped UUID>",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});


it("can't list invitations across teams", async ({ expect }) => {
  const listInvitationsResponse = await niceBackendFetch(`/api/v1/team-invitations`, {
    accessType: "server",
    method: "GET",
  });
  expect(listInvitationsResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "SCHEMA_ERROR",
        "details": { "message": "Request validation failed on GET /api/v1/team-invitations:\\n  - query.team_id must be defined" },
        "error": "Request validation failed on GET /api/v1/team-invitations:\\n  - query.team_id must be defined",
      },
      "headers": Headers {
        "x-stack-known-error": "SCHEMA_ERROR",
        <some fields may have been hidden>,
      },
    }
  `);
});


it("allows team admins to list invitations", async ({ expect }) => {
  const { userId: inviter } = await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${inviter}/$invite_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });
  await Team.sendInvitation("some-email-test@example.com", teamId);

  backendContext.set({ mailbox: createMailbox() });
  const { userId: teamAdmin } = await Auth.Otp.signIn();
  await Team.addMember(teamId, teamAdmin);

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${teamAdmin}/$invite_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });
  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${teamAdmin}/$read_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  const listInvitationsResponse = await niceBackendFetch(`/api/v1/team-invitations?team_id=${teamId}`, {
    accessType: "client",
    method: "GET",
  });
  expect(listInvitationsResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "expires_at_millis": <stripped field 'expires_at_millis'>,
            "id": "<stripped UUID>",
            "recipient_email": "some-email-test@example.com",
            "team_id": "<stripped UUID>",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("requires $invite_members permission to list invitations", async ({ expect }) => {
  const { userId: inviter } = await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${inviter}/$invite_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });
  await Team.sendInvitation("some-email-test@example.com", teamId);

  backendContext.set({ mailbox: createMailbox() });
  const { userId: teamAdmin } = await Auth.Otp.signIn();
  await Team.addMember(teamId, teamAdmin);

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${teamAdmin}/$read_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  const listInvitationsResponse = await niceBackendFetch(`/api/v1/team-invitations?team_id=${teamId}`, {
    accessType: "client",
    method: "GET",
  });
  expect(listInvitationsResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 401,
      "body": {
        "code": "TEAM_PERMISSION_REQUIRED",
        "details": {
          "permission_id": "$invite_members",
          "team_id": "<stripped UUID>",
          "user_id": "<stripped UUID>",
        },
        "error": "User <stripped UUID> does not have permission $invite_members in team <stripped UUID>.",
      },
      "headers": Headers {
        "x-stack-known-error": "TEAM_PERMISSION_REQUIRED",
        <some fields may have been hidden>,
      },
    }
  `);
});


it("requires $read_members permission to list invitations", async ({ expect }) => {
  const { userId: inviter } = await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${inviter}/$invite_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });
  const { sendTeamInvitationResponse } = await Team.sendInvitation("some-email-test@example.com", teamId);

  backendContext.set({ mailbox: createMailbox() });
  const { userId: teamAdmin } = await Auth.Otp.signIn();
  await Team.addMember(teamId, teamAdmin);

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${teamAdmin}/$invite_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  const listInvitationsResponse = await niceBackendFetch(`/api/v1/team-invitations?team_id=${teamId}`, {
    accessType: "client",
    method: "GET",
  });
  expect(listInvitationsResponse).toMatchInlineSnapshot(`
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
});

it("allows team admins to revoke invitations", async ({ expect }) => {
  const { userId: inviter } = await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${inviter}/$invite_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });
  const { sendTeamInvitationResponse } = await Team.sendInvitation("some-email-test@example.com", teamId);
  const invitationId = sendTeamInvitationResponse.body.id;

  backendContext.set({ mailbox: createMailbox() });
  const { userId: teamAdmin } = await Auth.Otp.signIn();
  await Team.addMember(teamId, teamAdmin);

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${teamAdmin}/$remove_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });

  const revokeInvitationResponse = await niceBackendFetch(`/api/v1/team-invitations/${invitationId}?team_id=${teamId}`, {
    accessType: "client",
    method: "DELETE",
  });
  expect(revokeInvitationResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${teamAdmin}/$invite_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });
  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${teamAdmin}/$read_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });
  const listInvitationsResponse = await niceBackendFetch(`/api/v1/team-invitations?team_id=${teamId}`, {
    accessType: "client",
    method: "GET",
  });
  expect(listInvitationsResponse).toMatchInlineSnapshot(`
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


it("requires $remove_members permission to revoke invitations", async ({ expect }) => {
  const { userId: inviter } = await Auth.Otp.signIn();
  const { teamId } = await Team.createAndAddCurrent();

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${inviter}/$invite_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });
  const { sendTeamInvitationResponse } = await Team.sendInvitation("some-email-test@example.com", teamId);
  const invitationId = sendTeamInvitationResponse.body.id;

  backendContext.set({ mailbox: createMailbox() });
  const { userId: teamAdmin } = await Auth.Otp.signIn();
  await Team.addMember(teamId, teamAdmin);

  const revokeInvitationResponse = await niceBackendFetch(`/api/v1/team-invitations/${invitationId}?team_id=${teamId}`, {
    accessType: "client",
    method: "DELETE",
  });
  expect(revokeInvitationResponse).toMatchInlineSnapshot(`
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
});
