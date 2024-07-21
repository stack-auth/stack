import { createTeamPermissionDefinition, deleteTeamPermissionDefinition, listTeamPermissionDefinitions, updateTeamPermissionDefinitions } from "@/lib/permissions";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { teamPermissionDefinitionsCrud } from '@stackframe/stack-shared/dist/interface/crud/team-permissions';
import { teamPermissionDefinitionIdSchema, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

export const teamPermissionDefinitionsCrudHandlers = createCrudHandlers(teamPermissionDefinitionsCrud, {
  paramsSchema: yupObject({
    permission_id: teamPermissionDefinitionIdSchema.required(),
  }),
  async onCreate({ auth, data }) {
    return await createTeamPermissionDefinition({
      project: auth.project,
      data,
    });
  },
  async onUpdate({ auth, data, params }) {
    return await updateTeamPermissionDefinitions({
      project: auth.project,
      permissionId: params.permission_id,
      data,
    });
  },
  async onDelete({ auth, params }) {
    await deleteTeamPermissionDefinition({
      project: auth.project,
      permissionId: params.permission_id
    });
  },
  async onList({ auth }) {
    return {
      items: await listTeamPermissionDefinitions(auth.project),
      is_paginated: false,
    };
  },
});
