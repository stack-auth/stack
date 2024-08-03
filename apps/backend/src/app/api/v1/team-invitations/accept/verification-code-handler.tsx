import { teamMembershipsCrudHandlers } from "@/app/api/v1/team-memberships/crud";
import { sendEmailFromTemplate } from "@/lib/emails";
import { createVerificationCodeHandler } from "@/route-handlers/verification-code-handler";
import { VerificationCodeType } from "@prisma/client";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { teamsCrudHandlers } from "../../teams/crud";

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
  },
  userRequired: true,
  type: VerificationCodeType.TEAM_INVITATION,
  data: yupObject({
    team_id: yupString().required(),
  }).required(),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupObject({
      team_display_name: yupString().required(),
    }).required(),
  }),
  async send(codeObj, createOptions, sendOptions: { user: UsersCrud["Admin"]["Read"] }) {
    await sendEmailFromTemplate({
      project: createOptions.project,
      user: sendOptions.user,
      email: createOptions.method.email,
      templateType: "email_verification",
      extraVariables: {
        emailVerificationLink: codeObj.link.toString(),
      },
    });
  },
  async handler(project, {}, data, body, user) {
    const team = await teamsCrudHandlers.adminRead({
      project,
      team_id: data.team_id,
    });

    await teamMembershipsCrudHandlers.adminCreate({
      project,
      team_id: data.team_id,
      user_id: user.id,
      data: {},
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        team_display_name: team.display_name,
      }
    };
  },
});
