import { CrudTypeOf, createCrud } from "../../crud";
import { yupObject, yupString } from "../../schema-fields";

export const connectedAccountAccessTokenReadSchema = yupObject({
  access_token: yupString().required(),
}).required();

export const connectedAccountAccessTokenCreateSchema = yupObject({
  scope: yupString().optional(),
}).required();

export const connectedAccountAccessTokenCrud = createCrud({
  clientReadSchema: connectedAccountAccessTokenReadSchema,
  clientCreateSchema: connectedAccountAccessTokenCreateSchema,
  docs: {
    clientCreate: {
      hidden: true,
    }
  },
});
export type ConnectedAccountAccessTokenCrud = CrudTypeOf<typeof connectedAccountAccessTokenCrud>;
