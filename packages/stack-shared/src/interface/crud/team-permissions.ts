import { CrudTypeOf, createCrud } from "../../crud";
import { customTeamPermissionIdSchema, teamPermissionIdSchema, yupArray, yupMixed, yupObject, yupString } from "../../schema-fields";

// Team permissions

export const teamPermissionsCrudClientReadSchema = yupObject({
  id: yupString().required(),
  user_id: yupString().required(),
  team_id: yupString().required(),
}).required();

export const teamPermissionsCrudServerCreateSchema = yupObject({
}).required();

export const teamPermissionsCrudServerDeleteSchema = yupMixed();

export const teamPermissionsCrud = createCrud({
  clientReadSchema: teamPermissionsCrudClientReadSchema,
  serverCreateSchema: teamPermissionsCrudServerCreateSchema,
  serverDeleteSchema: teamPermissionsCrudServerDeleteSchema,
  docs: {
  },
});
export type TeamPermissionsCrud = CrudTypeOf<typeof teamPermissionsCrud>;

// Team permission definitions

export const teamPermissionDefinitionsCrudServerReadSchema = yupObject({
  id: teamPermissionIdSchema.required(),
  __database_id: yupString().required(),
  description: yupString().optional(),
  contained_permission_ids: yupArray(teamPermissionIdSchema.required()).required()
}).required();

export const teamPermissionDefinitionsCrudServerCreateSchema = yupObject({
  id: customTeamPermissionIdSchema.required(),
  description: yupString().optional(),
  contained_permission_ids: yupArray(teamPermissionIdSchema.required()).optional()
}).required();

export const teamPermissionDefinitionsCrudServerUpdateSchema = yupObject({
  id: customTeamPermissionIdSchema.required(),
  description: yupString().optional(),
  contained_permission_ids: yupArray(teamPermissionIdSchema.required()).optional()
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