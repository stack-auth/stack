import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";
import * as fieldSchema from "../../schema-fields";

export const usersCrudServerUpdateSchema = yup.object({
  displayName: fieldSchema.userDisplayNameSchema.optional(),
  clientMetadata: fieldSchema.userClientMetadataSchema.optional(),
  serverMetadata: fieldSchema.userServerMetadataSchema.optional(),
  primaryEmail: fieldSchema.primaryEmailSchema.nullable().optional(),
  primaryEmailVerified: fieldSchema.primaryEmailVerifiedSchema.optional(),
  selectedTeamId: fieldSchema.selectedTeamIdSchema.nullable().optional(),
}).required();

export const usersCrudServerReadSchema = yup.object({
  projectId: fieldSchema.projectIdSchema.required(),
  id: fieldSchema.userIdSchema.required(),
  primaryEmail: fieldSchema.primaryEmailSchema.nullable().defined(),
  primaryEmailVerified: fieldSchema.primaryEmailVerifiedSchema.required(),
  displayName: fieldSchema.userDisplayNameSchema.nullable().defined(),
  // TODO give this one the type of an actual team
  selectedTeam: yup.mixed().nullable().defined(),
  selectedTeamId: fieldSchema.selectedTeamIdSchema.nullable().defined(),
  profileImageUrl: fieldSchema.profileImageUrlSchema.nullable().defined(),
  signedUpAtMillis: fieldSchema.signedUpAtMillisSchema.required(),
  authMethod: yup.string().oneOf(["credential", "oauth"]).required().meta({ openapi: { hide: true } }), // not used anymore, for backwards compatibility
  hasPassword: yup.boolean().required().meta({ openapi: { description: 'Whether the user has a password', exampleValue: true } }),
  authWithEmail: yup.boolean().required().meta({ openapi: { description: 'Whether the user can authenticate with their primary e-mail. If set to true, the user can log-in with credentials and/or magic link, if enabled in the project settings.', exampleValue: true } }),
  oauthProviders: yup.array(yup.string().required()).required().meta({ openapi: { description: 'All the OAuth providers connected to this account', exampleValue: ['google', 'github'] } }),
  clientMetadata: fieldSchema.userClientMetadataSchema,
  serverMetadata: fieldSchema.userServerMetadataSchema,
}).required();

const serverDeleteSchema = yup.mixed();

export const usersCrud = createCrud({
  serverReadSchema: usersCrudServerReadSchema,
  serverUpdateSchema: usersCrudServerUpdateSchema,
  serverDeleteSchema: serverDeleteSchema,
});
export type UsersCrud = CrudTypeOf<typeof usersCrud>;
