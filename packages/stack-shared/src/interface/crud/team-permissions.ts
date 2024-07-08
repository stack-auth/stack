import { CrudTypeOf, createCrud } from "../../crud";
import { yupArray, yupMixed, yupObject, yupString } from "../../schema-fields";

export const teamPermissionsCrudServerReadSchema = yupObject({
  id: yupString().required(),
}).required();

export const teamPermissionsCrudServerCreateSchema = yupObject({
}).required();

export const teamPermissionsCrudServerDeleteSchema = yupMixed();

export const teamPermissionsCrud = createCrud({
  serverReadSchema: teamPermissionsCrudServerReadSchema,
  serverCreateSchema: teamPermissionsCrudServerCreateSchema,
  serverDeleteSchema: teamPermissionsCrudServerDeleteSchema,
  docs: {
  },
});
export type teamPermissionsCrud = CrudTypeOf<typeof teamPermissionsCrud>;

export const teamPermissionDefinitionsCrudServerReadSchema = yupObject({
  id: yupString().required(),
  __database_id: yupString().required(),
  description: yupString().optional(),
  contained_permission_ids: yupArray(yupString().required()).required(),
}).required();

export const teamPermissionDefinitionsCrudServerCreateSchema = yupObject({
  id: yupString().required(),
  description: yupString().optional(),
  contained_permission_ids: yupArray(yupString().required()).optional()
}).required();

export const teamPermissionDefinitionsCrudServerUpdateSchema = yupObject({
  id: yupString().optional(),
  description: yupString().optional(),
  contained_permission_ids: yupArray(yupString().required()).optional(),
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