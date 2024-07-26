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

export const standardProviders = ["google", "github", "facebook", "microsoft", "spotify"] as const;
export const sharedProviders = ["google", "github", "facebook", "microsoft"] as const;
export const allProviders = ["google", "github", "facebook", "microsoft", "spotify"] as const;

export type ProviderType = typeof allProviders[number];
export type StandardProviderType = typeof standardProviders[number];
export type SharedProviderType = typeof sharedProviders[number];
