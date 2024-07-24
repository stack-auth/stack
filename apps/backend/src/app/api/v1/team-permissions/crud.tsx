import { grantTeamPermission, listUserTeamPermissions, revokeTeamPermission } from "@/lib/permissions";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { getIdFromUserIdOrMe } from "@/route-handlers/utils";
import { teamPermissionsCrud } from '@stackframe/stack-shared/dist/interface/crud/team-permissions';
import { teamPermissionDefinitionIdSchema, userIdOrMeSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";

export const teamPermissionsCrudHandlers = createCrudHandlers(teamPermissionsCrud, {
  querySchema: yupObject({
    team_id: yupString().uuid().optional().meta({ openapiField: { description: 'Filter with the team ID. If set, only the permissions of the members in a specific team will be returned.', exampleValue: 'cce084a3-28b7-418e-913e-c8ee6d802ea4' } }),
    user_id: userIdOrMeSchema.optional().meta({ openapiField: { description: 'Filter with the user ID. If set, only the permissions this user has will be returned. Client request must set `user_id=me`', exampleValue: 'me' } }),
    permission_id: teamPermissionDefinitionIdSchema.optional().meta({ openapiField: { description: 'Filter with the permission ID. If set, only the permissions with this specific ID will be returned', exampleValue: '16399452-c4f3-4554-8e44-c2d67bb60360' } }),
    recursive: yupString().oneOf(['true', 'false']).optional().meta({ openapiField: { description: 'Whether to list permissions recursively. If set to `false`, only the permission the users directly have will be listed. If set to `true` all the direct and indirect permissions will be listed.', exampleValue: 'true' } }),
  }),
  paramsSchema: yupObject({
    team_id: yupString().uuid().required(),
    user_id: userIdOrMeSchema.required(),
    permission_id: teamPermissionDefinitionIdSchema.required(),
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
    const userId = getIdFromUserIdOrMe(query.user_id, auth.user);
    if (auth.type === 'client' && userId !== auth.user?.id) {
      throw new StatusError(StatusError.Forbidden, 'Client can only list permissions for their own user. user_id must be either "me" or the ID of the current user');
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
