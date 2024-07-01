import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";
import * as fieldSchema from "../../schema-fields";

export const usersCrudServerUpdateSchema = yup.object({
  display_name: fieldSchema.userDisplayNameSchema.optional(),
  client_metadata: fieldSchema.userClientMetadataSchema.optional(),
  server_metadata: fieldSchema.userServerMetadataSchema.optional(),
  primary_email: fieldSchema.primaryEmailSchema.nullable().optional(),
  primary_email_verified: fieldSchema.primaryEmailVerifiedSchema.optional(),
  selected_team_id: fieldSchema.selectedTeamIdSchema.nullable().optional(),
}).required();

export const usersCrudServerReadSchema = yup.object({
  project_id: fieldSchema.projectIdSchema.required(),
  id: fieldSchema.userIdResponseSchema.required(),
  primary_email: fieldSchema.primaryEmailSchema.nullable().defined(),
  primary_email_verified: fieldSchema.primaryEmailVerifiedSchema.required(),
  display_name: fieldSchema.userDisplayNameSchema.nullable().defined(),
  // TODO give this one the type of an actual team
  selected_team: yup.mixed().nullable().defined(),
  selected_team_id: fieldSchema.selectedTeamIdSchema.nullable().defined(),
  profile_image_url: fieldSchema.profileImageUrlSchema.nullable().defined(),
  signed_up_at_millis: fieldSchema.signedUpAtMillisSchema.required(),
  has_password: yup.boolean().required().meta({ openapiField: { description: 'Whether the user has a password associated with their account', exampleValue: true } }),
  auth_with_email: yup.boolean().required().meta({ openapiField: { description: 'Whether the user can authenticate with their primary e-mail. If set to true, the user can log-in with credentials and/or magic link, if enabled in the project settings.', exampleValue: true } }),
  oauth_providers: yup.array(yup.string().required()).required().meta({ openapiField: { description: 'All the OAuth providers connected to this account', exampleValue: ['google', 'github'] } }),
  client_metadata: fieldSchema.userClientMetadataSchema,
  server_metadata: fieldSchema.userServerMetadataSchema,
}).required();

export const usersCrudServerCreateSchema = usersCrudServerUpdateSchema.concat(yup.object({
  primary_email: fieldSchema.primaryEmailSchema.required(),
  primary_email_verified: fieldSchema.primaryEmailVerifiedSchema.required(),
  auth_with_email: yup.boolean().oneOf([true]).required().meta({ openapiField: { description: 'Must always be set to true.', exampleValue: true } }),
}).required());

export const usersCrudServerDeleteSchema = yup.mixed();

export const usersCrud = createCrud({
  serverReadSchema: usersCrudServerReadSchema,
  serverUpdateSchema: usersCrudServerUpdateSchema,
  serverCreateSchema: usersCrudServerCreateSchema,
  serverDeleteSchema: usersCrudServerDeleteSchema,
  docs: {
    tags: ["Users"],
    serverCreate: {
      summary: 'Create user',
      description: 'Creates a new user. E-mail authentication is always enabled, and no password is set, meaning the only way to authenticate the newly created user is through magic link.',
    },
    serverRead: {
      summary: 'Get user',
      description: 'Gets a user by user ID.',
    },
    serverUpdate: {
      summary: 'Update user',
      description: 'Updates a user. Only the values provided will be updated.',
    },
    serverDelete: {
      summary: 'Delete user',
      description: 'Deletes a user. Use this with caution.',
    },
    serverList: {
      summary: 'List users',
      description: 'Lists all the users in the project.',
    },
  },
});
export type UsersCrud = CrudTypeOf<typeof usersCrud>;
