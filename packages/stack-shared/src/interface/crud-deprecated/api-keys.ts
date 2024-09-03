import { CrudTypeOf, createCrud } from "../../crud";
import { yupBoolean, yupMixed, yupNumber, yupObject, yupString } from "../../schema-fields";

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

export const apiKeysCreateOutputSchema = baseApiKeysReadSchema.concat(
  yupObject({
    publishable_client_key: yupString().optional(),
    secret_server_key: yupString().optional(),
    super_secret_admin_key: yupString().optional(),
  }).required(),
);

// Used for list, read and update endpoints after the initial creation
export const apiKeysCrudAdminObfuscatedReadSchema = baseApiKeysReadSchema.concat(
  yupObject({
    publishable_client_key: yupObject({
      last_four: yupString().required(),
    }).optional(),
    secret_server_key: yupObject({
      last_four: yupString().required(),
    }).optional(),
    super_secret_admin_key: yupObject({
      last_four: yupString().required(),
    }).optional(),
  }),
);

export const apiKeysCrudAdminUpdateSchema = yupObject({
  description: yupString().optional(),
  revoked: yupBoolean().oneOf([true]).optional(),
}).required();

export const apiKeysCrudAdminDeleteSchema = yupMixed();

export const apiKeysCrud = createCrud({
  adminReadSchema: apiKeysCrudAdminObfuscatedReadSchema,
  adminUpdateSchema: apiKeysCrudAdminUpdateSchema,
  adminDeleteSchema: apiKeysCrudAdminDeleteSchema,
  docs: {
    adminList: {
      hidden: true,
    },
    adminRead: {
      hidden: true,
    },
    adminCreate: {
      hidden: true,
    },
    adminUpdate: {
      hidden: true,
    },
    adminDelete: {
      hidden: true,
    },
  },
});
export type ApiKeysCrud = CrudTypeOf<typeof apiKeysCrud>;
