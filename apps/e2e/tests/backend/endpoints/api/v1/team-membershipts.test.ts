import { createMailbox, it } from "../../../../helpers";
import { Auth, Team, backendContext, niceBackendFetch } from "../../../backend-helpers";


it("is not allowed to add user to team on client", async ({ expect }) => {
  const { userId: userId1 } = await Auth.Otp.signIn();
  const { userId: userId2 } = await Auth.Otp.signIn();
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

it("creates a team and add a user to it on the server", async ({ expect }) => {
  const { userId: userId1 } = await Auth.Otp.signIn();
  backendContext.set({
    mailbox: createMailbox(),
  });
  const { userId: userId2 } = await Auth.Otp.signIn();
  const { teamId } = await Team.create();

  console.log(userId1, userId2, teamId);

  const response = await niceBackendFetch(`/api/v1/team-memberships/${teamId}/${userId1}`, { 
    accessType: "server",
    method: "POST",
    body: {},
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {},
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});