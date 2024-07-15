import { isTeamSystemPermission, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { teamMembershipsCrud } from "@stackframe/stack-shared/dist/interface/crud/team-memberships";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";


export const teamMembershipsCrudHandlers = createCrudHandlers(teamMembershipsCrud, {
  paramsSchema: yupObject({
    team_id: yupString().required(),
    user_id: yupString().required(),
  }),
  onCreate: async ({ auth, params }) => {
    await prismaClient.teamMember.create({
      data: {
        projectUserId: params.user_id,
        teamId: params.team_id,
        projectId: auth.project.id,
        directPermissions: {
          create: auth.project.evaluatedConfig.teamMemberDefaultPermissions.map((p) => {
            if (isTeamSystemPermission(p.id)) {
              return {
                systemPermission: teamSystemPermissionStringToDBType(p.id),
              };
            } else {
              return {
                permission: {
                  connect: {
                    projectConfigId_queryableId: {
                      projectConfigId: auth.project.evaluatedConfig.id,
                      queryableId: p.id,
                    },
                  }
                }
              };
            }
          }),
        }
      },
    });
    return {};
  },
  onDelete: async ({ auth, params }) => {
    await prismaClient.teamMember.delete({
      where: {
        projectId_projectUserId_teamId: {
          projectId: auth.project.id,
          projectUserId: params.user_id,
          teamId: params.team_id,
        },
      },
    });
  },
});