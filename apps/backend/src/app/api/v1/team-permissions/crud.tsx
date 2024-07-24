import { grantTeamPermission, listUserTeamPermissions, revokeTeamPermission } from "@/lib/permissions";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { getIdFromUserIdOrMe } from "@/route-handlers/utils";
import { teamPermissionsCrud } from '@stackframe/stack-shared/dist/interface/crud/team-permissions';
import { teamPermissionDefinitionIdSchema, userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";

export const teamPermissionsCrudHandlers = createCrudHandlers(teamPermissionsCrud, {
  querySchema: yupObject({
    team_id: yupString().uuid().optional(),
    user_id: userIdOrMeSchema.optional(),
    permission_id: teamPermissionDefinitionIdSchema.optional(),
    recursive: yupString().oneOf(['true', 'false']).optional(),
  }),
  paramsSchema: yupObject({
    team_id: yupString().uuid().required(),
    user_id: userIdOrMeSchema.required(),
    permission_id: teamPermissionDefinitionIdSchema.required(),
  }),
  async onCreate({ auth, params }) {
    return await prismaClient.$transaction(async (tx) => {
      return await grantTeamPermission(tx, {
        project: auth.project,
        teamId: params.team_id,
        userId: params.user_id,
        permissionId: params.permission_id
      });
    });
  },
  async onDelete({ auth, params }) {
    return await prismaClient.$transaction(async (tx) => {
      return await revokeTeamPermission(tx, {
        project: auth.project,
        teamId: params.team_id,
        userId: params.user_id,
        permissionId: params.permission_id
      });
    });
  },
  async onList({ auth, query }) {
    const userId = getIdFromUserIdOrMe(query.user_id, auth.user);
    if (auth.type === 'client' && userId !== auth.user?.id) {
      throw new StatusError(StatusError.Forbidden, 'Client can only list permissions for their own user. user_id must be either "me" or the ID of the current user');
    }

    return await prismaClient.$transaction(async (tx) => {
      return {
        items: await listUserTeamPermissions(tx, {
          project: auth.project,
          teamId: query.team_id,
          permissionId: query.permission_id,
          userId,
          recursive: query.recursive === 'true',
        }),
        is_paginated: false,
      };
    });
  },
});
