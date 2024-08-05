import { CrudTypeOf, createCrud } from "../../crud";
import * as fieldSchema from "../../schema-fields";
import { WebhookEvent } from "../webhooks";
import { teamsCrudServerReadSchema } from "./teams";

export const usersCrudServerUpdateSchema = fieldSchema.yupObject({
  display_name: fieldSchema.userDisplayNameSchema.optional(),
  profile_image_url: fieldSchema.profileImageUrlSchema.optional(),
  client_metadata: fieldSchema.userClientMetadataSchema.optional(),
  server_metadata: fieldSchema.userServerMetadataSchema.optional(),
  primary_email: fieldSchema.primaryEmailSchema.nullable().optional(),
  primary_email_verified: fieldSchema.primaryEmailVerifiedSchema.optional(),
  primary_email_auth_enabled: fieldSchema.yupBoolean().optional().meta({ openapiField: { description: "Whether the primary email can be used to sign into this user's account", exampleValue: true } }),
  password: fieldSchema.yupString().nullable().meta({ openapiField: { description: 'A new password for the user, overwriting the old one (if it exists).', exampleValue: 'password' } }),
  selected_team_id: fieldSchema.selectedTeamIdSchema.nullable().optional(),
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
  /**
   * @deprecated
   */
  auth_with_email: fieldSchema.yupBoolean().required().meta({ openapiField: { hidden: true, description: 'Whether the user can authenticate with their primary e-mail. If set to true, the user can log-in with credentials and/or magic link, if enabled in the project settings.', exampleValue: true } }),
  /**
   * @deprecated
   */
  oauth_providers: fieldSchema.yupArray(fieldSchema.yupObject({
    id: fieldSchema.yupString().required(),
    account_id: fieldSchema.yupString().required(),
    email: fieldSchema.yupString().nullable(),
  }).required()).required().meta({ openapiField: { hidden: true, description: 'A list of OAuth providers connected to this account', exampleValue: [{ id: 'google', account_id: '12345', email: 'john.doe@gmail.com' }] } }),
  auth_methods: fieldSchema.yupArray(fieldSchema.yupUnion(
    fieldSchema.yupObject({
      type: fieldSchema.yupString().oneOf(['password']).required(),
      identifier: fieldSchema.yupString().required(),
    }).required(),
    fieldSchema.yupObject({
      type: fieldSchema.yupString().oneOf(['otp']).required(),
      contact_channel: fieldSchema.yupObject({
        type: fieldSchema.yupString().oneOf(['email']).required(),
        email: fieldSchema.yupString().required(),
      }).required(),
    }).required(),
    fieldSchema.yupObject({
      type: fieldSchema.yupString().oneOf(['oauth']).required(),
      provider: fieldSchema.userOAuthProviderSchema.required(),
    }).required(),
  )).required().meta({ openapiField: { description: 'A list of authentication methods available for this user to sign in with', exampleValue: [ { "contact_channel": { "email": "john.doe@gmail.com", "type": "email", }, "type": "otp", } ] } }),
  connected_accounts: fieldSchema.yupArray(fieldSchema.yupUnion(
    fieldSchema.yupObject({
      type: fieldSchema.yupString().oneOf(['oauth']).required(),
      provider: fieldSchema.userOAuthProviderSchema.required(),
    }).required(),
  )).required().meta({ openapiField: { description: 'A list of connected accounts to this user', exampleValue: [ { "provider": { "provider_user_id": "12345", "type": "google", }, "type": "oauth", } ] } }),
  client_metadata: fieldSchema.userClientMetadataSchema,
  server_metadata: fieldSchema.userServerMetadataSchema,
}).required();

export const usersCrudServerCreateSchema = usersCrudServerUpdateSchema.concat(fieldSchema.yupObject({
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
