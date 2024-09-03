import { teamPermissionDefinitionsCrud } from "@stackframe/stack-shared/dist/interface/crud/team-permissions";
import { teamPermissionDefinitionIdSchema, yupObject } from "@stackframe/stack-shared/dist/schema-fields";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import {
  createTeamPermissionDefinition,
  deleteTeamPermissionDefinition,
  listTeamPermissionDefinitions,
  updateTeamPermissionDefinitions,
} from "@/lib/permissions";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";

export const teamPermissionDefinitionsCrudHandlers = createLazyProxy(() =>
  createCrudHandlers(teamPermissionDefinitionsCrud, {
    paramsSchema: yupObject({
      permission_id: teamPermissionDefinitionIdSchema.required(),
    }),
    async onCreate({ auth, data }) {
      return await prismaClient.$transaction(async (tx) => {
        return await createTeamPermissionDefinition(tx, {
          project: auth.project,
          data,
        });
      });
    },
    async onUpdate({ auth, data, params }) {
      return await prismaClient.$transaction(async (tx) => {
        return await updateTeamPermissionDefinitions(tx, {
          project: auth.project,
          permissionId: params.permission_id,
          data,
        });
      });
    },
    async onDelete({ auth, params }) {
      return await prismaClient.$transaction(async (tx) => {
        await deleteTeamPermissionDefinition(tx, {
          project: auth.project,
          permissionId: params.permission_id,
        });
      });
    },
    async onList({ auth }) {
      return await prismaClient.$transaction(async (tx) => {
        return {
          items: await listTeamPermissionDefinitions(tx, auth.project),
          is_paginated: false,
        };
      });
    },
  }),
);
