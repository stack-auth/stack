import { CrudTypeOf, createCrud } from "../../crud";
import { yupObject, yupMixed, yupString, yupBoolean, yupNumber } from "../../schema-fields";

const baseApiKeysReadSchema = yupObject({
  id: yupString().required(),
  description: yupString().required(),
  expires_at_millis: yupNumber().required(),
  manually_revoked_at_millis: yupNumber().optional(),
  created_at_millis: yupNumber().required(),
});

// Used for the result of the create endpoint
export const apiKeysCreateInputSchema = yupObject({
  description: yupString().required(),
  expires_at_millis: yupNumber().required(),
  has_publishable_client_key: yupBoolean().required(),
  has_secret_server_key: yupBoolean().required(),
  has_super_secret_admin_key: yupBoolean().required(),
});

export const apiKeysCreateOutputSchema = baseApiKeysReadSchema.concat(yupObject({
  publishable_client_key: yupString().optional(),
  secret_server_key: yupString().optional(),
  super_secret_admin_key: yupString().optional(),
}).required());

// Used for all other endpoints after the initial creation
export const apiKeysCrudClientObfuscatedReadSchema = baseApiKeysReadSchema.concat(yupObject({
  publishable_client_key: yupObject({
    last_four: yupString().required(),
  }).optional(),
  secret_server_key: yupObject({
    last_four: yupString().required(),
  }).optional(),
  super_secret_admin_key: yupObject({
    last_four: yupString().required(),
  }).optional(),
}));

export const apiKeysCrudClientUpdateSchema = yupObject({
  description: yupString().optional(),
}).required();

export const apiKeysCrudClientDeleteSchema = yupMixed();

export const apiKeysCrud = createCrud({
  clientReadSchema: apiKeysCrudClientObfuscatedReadSchema,
  clientUpdateSchema: apiKeysCrudClientUpdateSchema,
  clientDeleteSchema: apiKeysCrudClientDeleteSchema,
  docs: {
    clientCreate: {
      hidden: true,
    },
    clientUpdate: {
      hidden: true,
    },
    clientDelete: {
      hidden: true,
    },
  },
});
export type ApiKeysCrud = CrudTypeOf<typeof apiKeysCrud>;
