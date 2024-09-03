import { ensureUserTeamPermissionExists } from "@/lib/request-checks";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { adaptSchema, clientOrHigherAuthTypeSchema, teamIdSchema, teamInvitationCallbackUrlSchema, teamInvitationEmailSchema, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { teamInvitationCodeHandler } from "../accept/verification-code-handler";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "Send an email to invite a user to a team",
    description: "The user receiving this email can join the team by clicking on the link in the email. If the user does not have an account yet, they will be prompted to create one.",
    tags: ["Emails"],
  },
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema.required(),
      user: adaptSchema.required(),
    }).required(),
    body: yupObject({
      team_id: teamIdSchema.required(),
      email: teamInvitationEmailSchema.required(),
      callback_url: teamInvitationCallbackUrlSchema.required(),
    }).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["success"]).required(),
  }),
  async handler({ auth, body }) {
    await prismaClient.$transaction(async (tx) => {
      if (auth.type === "client") {
        await ensureUserTeamPermissionExists(tx, {
          project: auth.project,
          userId: auth.user.id,
          teamId: body.team_id,
          permissionId: "$invite_members",
          errorType: 'required',
        });
      }
    });

    await teamInvitationCodeHandler.sendCode({
      project: auth.project,
      data: {
        team_id: body.team_id,
      },
      method: {
        email: body.email,
      },
      callbackUrl: body.callback_url,
    }, {
      user: auth.user,
    });

    return {
      statusCode: 200,
      bodyType: "success",
    };
  },
});
