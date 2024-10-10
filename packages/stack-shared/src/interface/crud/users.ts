import { CrudTypeOf, createCrud } from "../../crud";
import * as fieldSchema from "../../schema-fields";
import { WebhookEvent } from "../webhooks";
import { teamsCrudServerReadSchema } from "./teams";

export const usersCrudServerUpdateSchema = fieldSchema.yupObject({
  display_name: fieldSchema.userDisplayNameSchema.optional(),
  profile_image_url: fieldSchema.profileImageUrlSchema.nullable().optional(),
  client_metadata: fieldSchema.userClientMetadataSchema.optional(),
  client_read_only_metadata: fieldSchema.userClientReadOnlyMetadataSchema.optional(),
  server_metadata: fieldSchema.userServerMetadataSchema.optional(),
  primary_email: fieldSchema.primaryEmailSchema.nullable().optional(),
  primary_email_verified: fieldSchema.primaryEmailVerifiedSchema.optional(),
  primary_email_auth_enabled: fieldSchema.yupBoolean().optional().meta({ openapiField: { description: "Whether the primary email can be used to sign into this user's account", exampleValue: true } }),
  password: fieldSchema.yupString().nullable().meta({ openapiField: { description: 'A new password for the user, overwriting the old one (if it exists). Specifying this option revokes all current sessions.', exampleValue: 'my-new-password' } }),
  totp_secret_base64: fieldSchema.base64Schema.nullable().meta({ openapiField: { description: 'A TOTP secret for the user, overwriting the old one (if it exists). Set to null to disable 2FA.', exampleValue: 'dG90cC1zZWNyZXQ=' } }),
  selected_team_id: fieldSchema.selectedTeamIdSchema.nullable().optional(),
}).required();

const contactChannelSchema = fieldSchema.yupObject({
  id: fieldSchema.yupString().required(),
  type: fieldSchema.yupString().required(),
  value: fieldSchema.yupString().required(),
  is_primary: fieldSchema.yupBoolean().required(),
  is_verified: fieldSchema.yupBoolean().required(),
  used_for_auth: fieldSchema.yupBoolean().required(),
}).required();

export const usersCrudServerReadSchema = fieldSchema.yupObject({
  id: fieldSchema.userIdSchema.required(),
  primary_email: fieldSchema.primaryEmailSchema.nullable().defined(),
  primary_email_verified: fieldSchema.primaryEmailVerifiedSchema.required(),
  display_name: fieldSchema.userDisplayNameSchema.nullable().defined(),
  selected_team: teamsCrudServerReadSchema.nullable().defined(),
  selected_team_id: fieldSchema.selectedTeamIdSchema.nullable().defined(),
  profile_image_url: fieldSchema.profileImageUrlSchema.nullable().defined(),
  signed_up_at_millis: fieldSchema.signedUpAtMillisSchema.required(),
  has_password: fieldSchema.yupBoolean().required().meta({ openapiField: { description: 'Whether the user has a password associated with their account', exampleValue: true } }),
  client_metadata: fieldSchema.userClientMetadataSchema,
  client_read_only_metadata: fieldSchema.userClientReadOnlyMetadataSchema,
  server_metadata: fieldSchema.userServerMetadataSchema,
  last_active_at_millis: fieldSchema.userLastActiveAtMillisSchema.required(),

  oauth_providers: fieldSchema.yupArray(fieldSchema.yupObject({
    id: fieldSchema.yupString().required(),
    account_id: fieldSchema.yupString().required(),
    email: fieldSchema.yupString().nullable(),
  }).required()).required().meta({ openapiField: { hidden: true, description: 'A list of OAuth providers connected to this account', exampleValue: [{ id: 'google', account_id: '12345', email: 'john.doe@gmail.com' }] } }),

  /**
   * @deprecated
   */
  auth_with_email: fieldSchema.yupBoolean().required().meta({ openapiField: { hidden: true, description: 'Whether the user can authenticate with their primary e-mail. If set to true, the user can log-in with credentials and/or magic link, if enabled in the project settings.', exampleValue: true } }),
  /**
   * @deprecated
   */
  requires_totp_mfa: fieldSchema.yupBoolean().required().meta({ openapiField: { hidden: true, description: 'Whether the user is required to use TOTP MFA to sign in', exampleValue: false } }),
}).required();

export const usersCrudServerCreateSchema = usersCrudServerUpdateSchema.omit(['selected_team_id']).concat(fieldSchema.yupObject({
  oauth_providers: fieldSchema.yupArray(fieldSchema.yupObject({
    id: fieldSchema.yupString().required(),
    account_id: fieldSchema.yupString().required(),
    email: fieldSchema.yupString().nullable().defined().default(null),
  }).required()).optional(),
}).required());

export const usersCrudServerDeleteSchema = fieldSchema.yupMixed();

export const usersCrud = createCrud({
  serverReadSchema: usersCrudServerReadSchema,
  serverUpdateSchema: usersCrudServerUpdateSchema,
  serverCreateSchema: usersCrudServerCreateSchema,
  serverDeleteSchema: usersCrudServerDeleteSchema,
  docs: {
    serverCreate: {
      tags: ["Users"],
      summary: 'Create user',
      description: 'Creates a new user. E-mail authentication is always enabled, and no password is set, meaning the only way to authenticate the newly created user is through magic link.',
    },
    serverRead: {
      tags: ["Users"],
      summary: 'Get user',
      description: 'Gets a user by user ID.',
    },
    serverUpdate: {
      tags: ["Users"],
      summary: 'Update user',
      description: 'Updates a user. Only the values provided will be updated.',
    },
    serverDelete: {
      tags: ["Users"],
      summary: 'Delete user',
      description: 'Deletes a user. Use this with caution.',
    },
    serverList: {
      tags: ["Users"],
      summary: 'List users',
      description: 'Lists all the users in the project.',
    },
  },
});
export type UsersCrud = CrudTypeOf<typeof usersCrud>;

export const userCreatedWebhookEvent = {
  type: "user.created",
  schema: usersCrud.server.readSchema,
  metadata: {
    summary: "User Created",
    description: "This event is triggered when a user is created.",
    tags: ["Users"],
  },
} satisfies WebhookEvent<typeof usersCrud.server.readSchema>;

export const userUpdatedWebhookEvent = {
  type: "user.updated",
  schema: usersCrud.server.readSchema,
  metadata: {
    summary: "User Updated",
    description: "This event is triggered when a user is updated.",
    tags: ["Users"],
  },
} satisfies WebhookEvent<typeof usersCrud.server.readSchema>;

const webhookUserDeletedSchema = fieldSchema.yupObject({
  id: fieldSchema.userIdSchema.required(),
  teams: fieldSchema.yupArray(fieldSchema.yupObject({
    id: fieldSchema.yupString().required(),
  })).required(),
}).required();

export const userDeletedWebhookEvent = {
  type: "user.deleted",
  schema: webhookUserDeletedSchema,
  metadata: {
    summary: "User Deleted",
    description: "This event is triggered when a user is deleted.",
    tags: ["Users"],
  },
} satisfies WebhookEvent<typeof webhookUserDeletedSchema>;
