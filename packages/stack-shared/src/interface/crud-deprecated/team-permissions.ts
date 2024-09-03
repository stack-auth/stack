import { CrudTypeOf, createCrud } from "../../crud";
import * as schemaFields from "../../schema-fields";
import { yupMixed, yupObject } from "../../schema-fields";

// Team permissions

export const teamPermissionsCrudClientReadSchema = yupObject({
  id: schemaFields.teamPermissionDefinitionIdSchema.required(),
  user_id: schemaFields.userIdSchema.required(),
  team_id: schemaFields.teamIdSchema.required(),
}).required();

export const teamPermissionsCrudServerCreateSchema = yupObject({}).required();

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
    serverList: {
      summary: "List team permissions of a user",
      description: "Query and filter the permission with team_id, user_id, and permission_id",
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
  id: schemaFields.teamPermissionDefinitionIdSchema.required(),
  description: schemaFields.teamPermissionDescriptionSchema.optional(),
  contained_permission_ids: schemaFields.containedPermissionIdsSchema.required(),
}).required();

export const teamPermissionDefinitionsCrudServerCreateSchema = yupObject({
  id: schemaFields.customTeamPermissionDefinitionIdSchema.required(),
  description: schemaFields.teamPermissionDescriptionSchema.optional(),
  contained_permission_ids: schemaFields.containedPermissionIdsSchema.optional(),
}).required();

export const teamPermissionDefinitionsCrudServerUpdateSchema = yupObject({
  id: schemaFields.customTeamPermissionDefinitionIdSchema.required(),
  description: schemaFields.teamPermissionDescriptionSchema.optional(),
  contained_permission_ids: schemaFields.containedPermissionIdsSchema.optional(),
}).required();

export const teamPermissionDefinitionsCrudServerDeleteSchema = yupMixed();

export const teamPermissionDefinitionsCrud = createCrud({
  serverReadSchema: teamPermissionDefinitionsCrudServerReadSchema,
  serverCreateSchema: teamPermissionDefinitionsCrudServerCreateSchema,
  serverUpdateSchema: teamPermissionDefinitionsCrudServerUpdateSchema,
  serverDeleteSchema: teamPermissionDefinitionsCrudServerDeleteSchema,
  docs: {
    serverList: {
      summary: "List team permission definitions",
      description:
        "Query and filter the permission with team_id, user_id, and permission_id (the equivalent of listing permissions on the Stack dashboard)",
      tags: ["Permissions"],
    },
    serverCreate: {
      summary: "Create a new team permission definition",
      description: "Create a new permission definition (the equivalent of creating a new permission on the Stack dashboard)",
      tags: ["Permissions"],
    },
    serverUpdate: {
      summary: "Update a team permission definition",
      description: "Update a permission definition (the equivalent of updating a permission on the Stack dashboard)",
      tags: ["Permissions"],
    },
    serverDelete: {
      summary: "Delete a team permission definition",
      description: "Delete a permission definition (the equivalent of deleting a permission on the Stack dashboard)",
      tags: ["Permissions"],
    },
  },
});

export type TeamPermissionDefinitionsCrud = CrudTypeOf<typeof teamPermissionDefinitionsCrud>;
