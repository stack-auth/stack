import { teamMembershipsCrudHandlers } from "@/app/api/v1/team-memberships/crud";
import { sendEmailFromTemplate } from "@/lib/emails";
import { prismaClient } from "@/prisma-client";
import { createVerificationCodeHandler } from "@/route-handlers/verification-code-handler";
import { VerificationCodeType } from "@prisma/client";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { teamsCrudHandlers } from "../../teams/crud";
import { KnownErrors } from "@stackframe/stack-shared";

export const teamInvitationCodeHandler = createVerificationCodeHandler({
  metadata: {
    post: {
      summary: "Invite a user to a team",
      description: "Send an email to a user to invite them to a team",
      tags: ["Teams"],
    },
    check: {
      summary: "Check if a team invitation code is valid",
      description: "Check if a team invitation code is valid without using it",
      tags: ["Teams"],
    },
    details: {
      summary: "Get team invitation details",
      description: "Get additional information about a team invitation code",
      tags: ["Teams"],
    },
  },
  type: VerificationCodeType.TEAM_INVITATION,
  data: yupObject({
    team_id: yupString().required(),
  }).required(),
  method: yupObject({
    email: yupString().email().required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupObject({}).required(),
  }),
  detailsResponse: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupObject({
      team_id: yupString().required(),
      team_display_name: yupString().required(),
    }).required(),
  }),
  async send(codeObj, createOptions, sendOptions: { user: UsersCrud["Admin"]["Read"] }){
    const team = await teamsCrudHandlers.adminRead({
      project: createOptions.project,
      team_id: createOptions.data.team_id,
    });

    await sendEmailFromTemplate({
      project: createOptions.project,
      user: sendOptions.user,
      email: createOptions.method.email,
      templateType: "team_invitation",
      extraVariables: {
        teamInvitationLink: codeObj.link.toString(),
        teamDisplayName: team.display_name,
      },
    });
  },
  async handler(project, {}, data, body, user) {
    if (!user) throw new KnownErrors.UserAuthenticationRequired();

    const oldMembership = await prismaClient.teamMember.findUnique({
      where: {
        projectId_projectUserId_teamId: {
          projectId: project.id,
          projectUserId: user.id,
          teamId: data.team_id,
        },
      },
    });

    if (!oldMembership) {
      await teamMembershipsCrudHandlers.adminCreate({
        project,
        team_id: data.team_id,
        user_id: user.id,
        data: {},
      });
    }

    return {
      statusCode: 200,
      bodyType: "json",
      body: {}
    };
  },
  async details(project, {}, data, body, user) {
    if (!user) throw new KnownErrors.UserAuthenticationRequired();

    const team = await teamsCrudHandlers.adminRead({
      project,
      team_id: data.team_id,
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        team_id: team.id,
        team_display_name: team.display_name,
      },
    };
  }
});
