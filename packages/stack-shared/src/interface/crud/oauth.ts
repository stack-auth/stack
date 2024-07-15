import { CrudTypeOf, createCrud } from "../../crud";
import { yupObject, yupString } from "../../schema-fields";

export const accessTokenReadSchema = yupObject({
  access_token: yupString().required(),
}).required();

export const accessTokenCreateSchema = yupObject({
  scope: yupString().optional(),
}).required();

export const accessTokenCrud = createCrud({
  clientReadSchema: accessTokenReadSchema,
  clientCreateSchema: accessTokenCreateSchema,
});
export type AccessTokenCrud = CrudTypeOf<typeof accessTokenCrud>;
