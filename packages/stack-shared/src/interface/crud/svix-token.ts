import { CrudTypeOf, createCrud } from "../../crud";
import { yupObject, yupString } from "../../schema-fields";

export const svixTokenAdminReadSchema = yupObject({
  token: yupString().required(),
}).required();

export const svixTokenAdminCreateSchema = yupObject({}).required();

export const svixTokenCrud = createCrud({
  adminReadSchema: svixTokenAdminReadSchema,
  adminCreateSchema: svixTokenAdminCreateSchema,
  docs: {
    adminCreate: {
      hidden: true,
    },
  }
});
export type SvixTokenCrud = CrudTypeOf<typeof svixTokenCrud>;
