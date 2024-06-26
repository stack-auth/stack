import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";

export const accessTokenReadSchema = yup.object({
  access_token: yup.string().required(),
}).required();

export const accessTokenCreateSchema = yup.object({
  scope: yup.string().optional(),
}).required();

export const accessTokenCrud = createCrud({
  clientReadSchema: accessTokenReadSchema,
  clientCreateSchema: accessTokenCreateSchema,
});
export type AccessTokenCrud = CrudTypeOf<typeof accessTokenCrud>;
