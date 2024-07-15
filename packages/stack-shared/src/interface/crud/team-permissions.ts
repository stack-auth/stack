import { CrudTypeOf, createCrud } from "../../crud";
import * as schemaFields from "../../schema-fields";
import { yupMixed, yupObject } from "../../schema-fields";

// Team permissions

export const teamPermissionsCrudClientReadSchema = yupObject({
  id: schemaFields.teamPermissionIdSchema.required(),
  user_id: schemaFields.userIdSchema.required(),
  team_id: schemaFields.teamIdSchema.required(),
}).required();

export const teamPermissionsCrudServerCreateSchema = yupObject({
}).required();

export const teamPermissionsCrudServerDeleteSchema = yupMixed();

export const teamPermissionsCrud = createCrud({
  clientReadSchema: teamPermissionsCrudClientReadSchema,
  serverCreateSchema: teamPermissionsCrudServerCreateSchema,
  serverDeleteSchema: teamPermissionsCrudServerDeleteSchema,
  docs: {
    clientList: {
      summary: "List team permissions of the current user",
      description: "user_id=me needs to be set",
      tags: ["Permissions"],
    },
    serverCreate: {
      summary: "Grant a team permission to a user",
      description: "Grant a team permission to a user (the team permission must be created first on the Stack dashboard)",
      tags: ["Permissions"],
    },
    serverDelete: {
      summary: "Revoke a team permission from a user",
      description: "Revoke a team permission from a user",
      tags: ["Permissions"],
    },
  },
});
export type TeamPermissionsCrud = CrudTypeOf<typeof teamPermissionsCrud>;

// Team permission definitions

export const teamPermissionDefinitionsCrudServerReadSchema = yupObject({
  id: schemaFields.teamPermissionIdSchema.required(),
  description: schemaFields.teamPermissionDescriptionSchema.optional(),
  contained_permission_ids: schemaFields.containedPermissionIdsSchema.required()
}).required();

export const teamPermissionDefinitionsCrudServerCreateSchema = yupObject({
  id: schemaFields.customTeamPermissionIdSchema.required(),
  description: schemaFields.teamPermissionDescriptionSchema.optional(),
  contained_permission_ids: schemaFields.containedPermissionIdsSchema.optional()
}).required();

export const teamPermissionDefinitionsCrudServerUpdateSchema = yupObject({
  id: schemaFields.customTeamPermissionIdSchema.required(),
  description: schemaFields.teamPermissionDescriptionSchema.optional(),
  contained_permission_ids: schemaFields.containedPermissionIdsSchema.optional()
}).required();

export const teamPermissionDefinitionsCrudServerDeleteSchema = yupMixed();

export const teamPermissionDefinitionsCrud = createCrud({
  serverReadSchema: teamPermissionDefinitionsCrudServerReadSchema,
  serverCreateSchema: teamPermissionDefinitionsCrudServerCreateSchema,
  serverUpdateSchema: teamPermissionDefinitionsCrudServerUpdateSchema,
  serverDeleteSchema: teamPermissionDefinitionsCrudServerDeleteSchema,
  docs: {
  },
});

export type TeamPermissionDefinitionsCrud = CrudTypeOf<typeof teamPermissionDefinitionsCrud>;