import { CrudTypeOf, createCrud } from "../../crud";
import { yupObject, yupString } from "../../schema-fields";

export const providerAccessTokenReadSchema = yupObject({
  access_token: yupString().required(),
}).required();

export const providerAccessTokenCreateSchema = yupObject({
  scope: yupString().optional(),
}).required();

export const providerAccessTokenCrud = createCrud({
  clientReadSchema: providerAccessTokenReadSchema,
  clientCreateSchema: providerAccessTokenCreateSchema,
});
export type ProviderAccessTokenCrud = CrudTypeOf<typeof providerAccessTokenCrud>;

export type ProviderType = "google" | "github" | "microsoft" | "facebook" | "spotify";
export const providerList = ["google", "github", "microsoft", "facebook", "spotify"] as const;
