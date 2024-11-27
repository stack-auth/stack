import { ensureUserTeamPermissionExists } from "@/lib/request-checks";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { adaptSchema, clientOrHigherAuthTypeSchema, teamIdSchema, teamInvitationCallbackUrlSchema, teamInvitationEmailSchema, yupBoolean, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { teamInvitationCodeHandler } from "../accept/verification-code-handler";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "Send an email to invite a user to a team",
    description: "The user receiving this email can join the team by clicking on the link in the email. If the user does not have an account yet, they will be prompted to create one.",
    tags: ["Teams"],
  },
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema.defined(),
      user: adaptSchema.optional(),
    }).defined(),
    body: yupObject({
      team_id: teamIdSchema.defined(),
      email: teamInvitationEmailSchema.defined(),
      callback_url: teamInvitationCallbackUrlSchema.defined(),
    }).defined(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: yupObject({
      success: yupBoolean().oneOf([true]).defined(),
      id: yupString().uuid().defined(),
    }).defined(),
  }),
  async handler({ auth, body }) {
    await prismaClient.$transaction(async (tx) => {
      if (auth.type === "client") {
        if (!auth.user) throw new KnownErrors.UserAuthenticationRequired;

        await ensureUserTeamPermissionExists(tx, {
          project: auth.project,
          userId: auth.user.id,
          teamId: body.team_id,
          permissionId: "$invite_members",
          errorType: 'required',
          recursive: true,
        });
      }
    });

    const codeObj = await teamInvitationCodeHandler.sendCode({
      project: auth.project,
      data: {
        team_id: body.team_id,
      },
      method: {
        email: body.email,
      },
      callbackUrl: body.callback_url,
    }, {});

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        success: true,
        id: codeObj.id,
      },
    };
  },
});
