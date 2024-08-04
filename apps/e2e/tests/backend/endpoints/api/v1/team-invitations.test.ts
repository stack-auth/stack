import { createMailbox, it } from "../../../../helpers";
import { Auth, Team, backendContext, niceBackendFetch } from "../../../backend-helpers";

it("is not allowed to send invitation without permission", async ({ expect }) => {
  const { userId: userId1 } = await Auth.Otp.signIn();
  const { teamId } = await Team.create();

  const receiveMailbox = createMailbox();
  const { sendTeamInvitationResponse } = await Team.sendInvitation(receiveMailbox, teamId);

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

it("should verify user's email", async ({ expect }) => {
  const { userId: userId1 } = await Auth.Otp.signIn();
  const { teamId } = await Team.create();

  const receiveMailbox = createMailbox();

  await niceBackendFetch(`/api/v1/team-permissions/${teamId}/${userId1}/$invite_members`, {
    accessType: "server",
    method: "POST",
    body: {},
  });


  const { sendTeamInvitationResponse } = await Team.sendInvitation(receiveMailbox, teamId);

  expect(sendTeamInvitationResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  backendContext.set({ mailbox: receiveMailbox });
  const { userId: userId2 } = await Auth.Otp.signIn();

  await Team.acceptInvitation();
});