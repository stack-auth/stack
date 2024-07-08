import { CrudTypeOf, createCrud } from "../../crud";
import { yupMixed, yupObject, yupString } from "../../schema-fields";

export const teamPermissionsCrudServerReadSchema = yupObject({
  id: yupString().required(),
  __database_id: yupString().required(),
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