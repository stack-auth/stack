import { createPermissionDefinition, deletePermissionDefinition, listPermissionDefinitions, updatePermissionDefinitions } from "@/lib/permissions";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { teamPermissionDefinitionsCrud } from '@stackframe/stack-shared/dist/interface/crud/team-permissions';
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

export const teamPermissionDefinitionsCrudHandlers = createCrudHandlers(teamPermissionDefinitionsCrud, {
  paramsSchema: yupObject({
    permissionId: yupString().required(),
  }),
  async onCreate({ auth, data }) {
    return await createPermissionDefinition(auth.project, { type: "any-team" }, data);
  },
  async onUpdate({ auth, data, params }) {
    return await updatePermissionDefinitions(auth.project, { type: "any-team" }, params.permissionId, data);
  },
  async onDelete({ auth, params }) {
    await deletePermissionDefinition(auth.project, { type: "any-team" }, params.permissionId);
  },
  async onList({ auth }) {
    return {
      items: await listPermissionDefinitions(auth.project, { type: "any-team" }),
      is_paginated: false,
    };
  },
});
