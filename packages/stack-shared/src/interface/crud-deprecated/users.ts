import { CrudTypeOf, createCrud } from "../../crud";
import * as fieldSchema from "../../schema-fields";

export const usersCrudServerUpdateSchema = fieldSchema
  .yupObject({
    display_name: fieldSchema.userDisplayNameSchema.optional(),
    profile_image_url: fieldSchema.profileImageUrlSchema.optional(),
    client_metadata: fieldSchema.userClientMetadataSchema.optional(),
    server_metadata: fieldSchema.userServerMetadataSchema.optional(),
    primary_email: fieldSchema.primaryEmailSchema.nullable().optional(),
    primary_email_verified: fieldSchema.primaryEmailVerifiedSchema.optional(),
    primary_email_auth_enabled: fieldSchema
      .yupBoolean()
      .optional()
      .meta({
        openapiField: { description: "Whether the primary email can be used to sign into this user's account", exampleValue: true },
      }),
    password: fieldSchema
      .yupString()
      .nullable()
      .meta({
        openapiField: { description: "A new password for the user, overwriting the old one (if it exists).", exampleValue: "password" },
      }),
    selected_team_id: fieldSchema.selectedTeamIdSchema.nullable().optional(),
  })
  .required();

export const usersCrudServerReadSchema = fieldSchema
  .yupObject({
    project_id: fieldSchema.projectIdSchema.required(),
    id: fieldSchema.userIdSchema.required(),
    primary_email: fieldSchema.primaryEmailSchema.nullable().defined(),
    primary_email_verified: fieldSchema.primaryEmailVerifiedSchema.required(),
    display_name: fieldSchema.userDisplayNameSchema.nullable().defined(),
    // TODO give this one the type of an actual team
    selected_team: fieldSchema.yupMixed().nullable().defined(),
    selected_team_id: fieldSchema.selectedTeamIdSchema.nullable().defined(),
    profile_image_url: fieldSchema.profileImageUrlSchema.nullable().defined(),
    signed_up_at_millis: fieldSchema.signedUpAtMillisSchema.required(),
    has_password: fieldSchema
      .yupBoolean()
      .required()
      .meta({ openapiField: { description: "Whether the user has a password associated with their account", exampleValue: true } }),
    auth_with_email: fieldSchema
      .yupBoolean()
      .required()
      .meta({
        openapiField: {
          description:
            "Whether the user can authenticate with their primary e-mail. If set to true, the user can log-in with credentials and/or magic link, if enabled in the project settings.",
          exampleValue: true,
        },
      }),
    oauth_providers: fieldSchema
      .yupArray(
        fieldSchema
          .yupObject({
            provider_id: fieldSchema.yupString().required(),
            account_id: fieldSchema.yupString().required(),
            email: fieldSchema.yupString().nullable(),
          })
          .required(),
      )
      .required()
      .meta({ openapiField: { description: "A list of OAuth providers connected to this account", exampleValue: ["google", "github"] } }),
    client_metadata: fieldSchema.userClientMetadataSchema,
    server_metadata: fieldSchema.userServerMetadataSchema,
  })
  .required();

export const usersCrudServerCreateSchema = usersCrudServerUpdateSchema.concat(
  fieldSchema
    .yupObject({
      oauth_providers: fieldSchema
        .yupArray(
          fieldSchema
            .yupObject({
              provider_id: fieldSchema.yupString().required(),
              account_id: fieldSchema.yupString().required(),
              email: fieldSchema.yupString().nullable().defined().default(null),
            })
            .required(),
        )
        .optional(),
    })
    .required(),
);

export const usersCrudServerDeleteSchema = fieldSchema.yupMixed();

export const usersCrud = createCrud({
  serverReadSchema: usersCrudServerReadSchema,
  serverUpdateSchema: usersCrudServerUpdateSchema,
  serverCreateSchema: usersCrudServerCreateSchema,
  serverDeleteSchema: usersCrudServerDeleteSchema,
  docs: {
    serverCreate: {
      tags: ["Users"],
      summary: "Create user",
      description:
        "Creates a new user. E-mail authentication is always enabled, and no password is set, meaning the only way to authenticate the newly created user is through magic link.",
    },
    serverRead: {
      tags: ["Users"],
      summary: "Get user",
      description: "Gets a user by user ID.",
    },
    serverUpdate: {
      tags: ["Users"],
      summary: "Update user",
      description: "Updates a user. Only the values provided will be updated.",
    },
    serverDelete: {
      tags: ["Users"],
      summary: "Delete user",
      description: "Deletes a user. Use this with caution.",
    },
    serverList: {
      tags: ["Users"],
      summary: "List users",
      description: "Lists all the users in the project.",
    },
  },
});
export type UsersCrud = CrudTypeOf<typeof usersCrud>;
