import { ensureTeamExist, ensureTeamMembershipExists, ensureTeamMembershipDoesNotExist, ensureUserTeamPermissionExists } from "@/lib/request-checks";
import { isTeamSystemPermission, teamSystemPermissionStringToDBType } from "@/lib/permissions";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { teamMembershipsCrud } from "@stackframe/stack-shared/dist/interface/crud/team-memberships";
import { userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { KnownErrors } from "@stackframe/stack-shared";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { PrismaTransaction } from "@/lib/types";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { sendTeamMembershipCreatedWebhook, sendTeamMembershipDeletedWebhook } from "@/lib/webhooks";


export async function addUserToTeam(tx: PrismaTransaction, options: {
  project: ProjectsCrud['Admin']['Read'],
  teamId: string,
  userId: string,
  type: 'member' | 'creator',
}) {
  const permissionAttributeName = options.type === 'creator' ? 'team_creator_default_permissions' : 'team_member_default_permissions';

  await tx.teamMember.create({
    data: {
      projectUserId: options.userId,
      teamId: options.teamId,
      projectId: options.project.id,
      directPermissions: {
        create: options.project.config[permissionAttributeName].map((p) => {
          if (isTeamSystemPermission(p.id)) {
            return {
              systemPermission: teamSystemPermissionStringToDBType(p.id),
            };
          } else {
            return {
              permission: {
                connect: {
                  projectConfigId_queryableId: {
                    projectConfigId: options.project.config.id,
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
}


export const teamMembershipsCrudHandlers = createLazyProxy(() => createCrudHandlers(teamMembershipsCrud, {
  paramsSchema: yupObject({
    team_id: yupString().uuid().required(),
    user_id: userIdOrMeSchema.required(),
  }),
  onCreate: async ({ auth, params }) => {
    await prismaClient.$transaction(async (tx) => {
      await ensureTeamExist(tx, {
        projectId: auth.project.id,
        teamId: params.team_id,
      });

      await ensureTeamMembershipDoesNotExist(tx, {
        projectId: auth.project.id,
        teamId: params.team_id,
        userId: params.user_id
      });

      const user = await tx.projectUser.findUnique({
        where: {
          projectId_projectUserId: {
            projectId: auth.project.id,
            projectUserId: params.user_id,
          },
        },
      });

      if (!user) {
        throw new KnownErrors.UserNotFound();
      }

      await addUserToTeam(tx, {
        project: auth.project,
        teamId: params.team_id,
        userId: params.user_id,
        type: 'member',
      });
    });

    const data = {
      team_id: params.team_id,
      user_id: params.user_id,
    };

    await sendTeamMembershipCreatedWebhook({
      projectId: auth.project.id,
      data,
    });

    return data;
  },
  onDelete: async ({ auth, params }) => {
    await prismaClient.$transaction(async (tx) => {
      // Users are always allowed to remove themselves from a team
      // Only users with the $remove_members permission can remove other users
      if (auth.type === 'client') {
        const currentUserId = auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());

        if (params.user_id !== currentUserId) {
          await ensureUserTeamPermissionExists(tx, {
            project: auth.project,
            teamId: params.team_id,
            userId: auth.user?.id ?? throwErr('auth.user is null'),
            permissionId: "$remove_members",
            errorType: 'required',
            recursive: true,
          });
        }
      }

      await ensureTeamMembershipExists(tx, {
        projectId: auth.project.id,
        teamId: params.team_id,
        userId: params.user_id,
      });

      await tx.teamMember.delete({
        where: {
          projectId_projectUserId_teamId: {
            projectId: auth.project.id,
            projectUserId: params.user_id,
            teamId: params.team_id,
          },
        },
      });
    });

    await sendTeamMembershipDeletedWebhook({
      projectId: auth.project.id,
      data: {
        team_id: params.team_id,
        user_id: params.user_id,
      },
    });
  },
}));
