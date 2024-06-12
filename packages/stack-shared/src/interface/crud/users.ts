import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";
import { yupJson } from "../../utils/yup";

export const usersCrudServerUpdateSchema = yup.object({
  displayName: yup.string().optional(),
  clientMetadata: yup.object().optional(),
  serverMetadata: yup.object().optional(),
  primaryEmail: yup.string().optional(),
  primaryEmailVerified: yup.boolean().optional(),
  selectedTeamId: yup.string().nullable().optional(),
}).required();

export const usersCrudServerReadSchema = yup.object({
  projectId: yup.string().required().meta({ description: 'Stack dashboard project ID', example: 'project-id' }),
  id: yup.string().required().meta({ description: 'Unique user identifier', example: 'user-id' }),
  primaryEmail: yup.string().nullable().defined().meta({ description: 'Primary email', example: 'johndeo@email.com' }),
  primaryEmailVerified: yup.boolean().required().meta({ description: 'Primary email verified', example: true }),
  displayName: yup.string().nullable().defined().meta({ description: 'Display name', example: 'John Deo' }),
  clientMetadata: yupJson.meta({ description: 'Client metadata. Used as a data store, accessible from the client side', example: { key: 'value' } }),
  selectedTeamId: yup.string().nullable().defined().meta({ description: 'Selected team ID', example: 'team-id' }),
  profileImageUrl: yup.string().nullable().defined().meta({ description: 'Profile image URL', example: 'https://example.com/image.png' }),
  signedUpAtMillis: yup.number().required().meta({ description: 'Signed up at milliseconds', example: 1630000000000 }),
  authMethod: yup.string().oneOf(["credential", "oauth"]).required().meta({ hide: true }), // not used anymore, for backwards compatibility
  hasPassword: yup.boolean().required().meta({ description: 'Whether the user has a password', example: true }),
  authWithEmail: yup.boolean().required().meta({ description: 'Whether the user can authenticate with email (email/password and magic link, depending on the project setting on the dashboard)', example: true }),
  oauthProviders: yup.array(yup.string().required()).required().meta({ description: 'All the OAuth providers connected to this account', example: ['google', 'github'] }),
  serverMetadata: yupJson.meta({ description: 'Server metadata. Used as a data store, only accessible from the server side', example: { key: 'value' } }),
}).required();

const serverDeleteSchema = yup.mixed();

export const usersCrud = createCrud({
  serverReadSchema: usersCrudServerReadSchema.meta({ 
    summary: 'Get server user',
    description: 'Get server user by id', 
    operationId: 'getServerUser' 
  }),
  serverUpdateSchema: usersCrudServerUpdateSchema,
  serverDeleteSchema,
});
export type UsersCrud = CrudTypeOf<typeof usersCrud>;
