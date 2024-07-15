import { grantTeamPermission, listUserTeamPermissions, revokeTeamPermission } from "@/lib/permissions";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { teamPermissionsCrud } from '@stackframe/stack-shared/dist/interface/crud/team-permissions';
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";

export const teamPermissionsCrudHandlers = createCrudHandlers(teamPermissionsCrud, {
  querySchema: yupObject({
    team_id: yupString().optional(),
    user_id: yupString().optional(),
    permission_id: yupString().optional(),
    recursive: yupString().oneOf(['true', 'false']).optional(),
  }),
  paramsSchema: yupObject({
    team_id: yupString().required(),
    user_id: yupString().required(),
    permission_id: yupString().required(),
  }),
  async onCreate({ auth, params }) {
    return await grantTeamPermission({
      project: auth.project,
      teamId: params.team_id,
      userId: params.user_id,
      permissionId: params.permission_id
    });
  },
  async onDelete({ auth, params }) {
    return await revokeTeamPermission({
      project: auth.project,
      teamId: params.team_id,
      userId: params.user_id,
      permissionId: params.permission_id
    });
  },
  async onList({ auth, query }) {
    let userId = query.user_id;
    if (userId === 'me') {
      if (!auth.user) {
        throw new StatusError(StatusError.BadRequest, 'User authentication required to list permissions for user_id=me');
      }
      userId = auth.user.id;
    }
    if (auth.type === 'client' && userId !== auth.user?.id) {
      throw new StatusError(StatusError.BadRequest, 'Client can only list permissions for their own user. user_id must be either "me" or the ID of the current user');
    }

    return {
      items: await listUserTeamPermissions({
        project: auth.project,
        teamId: query.team_id,
        permissionId: query.permission_id,
        userId,
        recursive: query.recursive === 'true',
      }),
      is_paginated: false,
    };
  },
});
