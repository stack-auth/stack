import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";
import { yupObject, yupString, yupNumber, yupBoolean, yupArray, yupMixed } from "../../schema-fields";

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
