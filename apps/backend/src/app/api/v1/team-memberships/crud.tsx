import { ensureTeamExist, ensureTeamMembershipDoesNotExist } from "@/lib/db-checks";
import { isTeamSystemPermission, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { getIdFromUserIdOrMe } from "@/route-handlers/utils";
import { teamMembershipsCrud } from "@stackframe/stack-shared/dist/interface/crud/team-memberships";
import { userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";


export const teamMembershipsCrudHandlers = createCrudHandlers(teamMembershipsCrud, {
  paramsSchema: yupObject({
    team_id: yupString().uuid().required(),
    user_id: userIdOrMeSchema.required(),
  }),
  onCreate: async ({ auth, params }) => {
    const userId = getIdFromUserIdOrMe(params.user_id, auth.user);

    await prismaClient.$transaction(async (tx) => {
      await ensureTeamExist(tx, {
        projectId: auth.project.id,
        teamId: params.team_id,
      });

      await ensureTeamMembershipDoesNotExist(tx, {
        projectId: auth.project.id,
        teamId: params.team_id,
        userId,
      });

      await tx.teamMember.create({
        data: {
          projectUserId: userId,
          teamId: params.team_id,
          projectId: auth.project.id,
          directPermissions: {
            create: auth.project.config.team_member_default_permissions.map((p) => {
              if (isTeamSystemPermission(p.id)) {
                return {
                  systemPermission: teamSystemPermissionStringToDBType(p.id),
                };
              } else {
                return {
                  permission: {
                    connect: {
                      projectConfigId_queryableId: {
                        projectConfigId: auth.project.config.id,
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
