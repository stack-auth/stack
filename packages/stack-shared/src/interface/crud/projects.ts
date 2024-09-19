import { CrudTypeOf, createCrud } from "../../crud";
import * as schemaFields from "../../schema-fields";
import { yupArray, yupObject, yupRequiredWhen, yupString } from "../../schema-fields";
import { allProviders, sharedProviders, standardProviders } from "../../utils/oauth";

const teamPermissionSchema = yupObject({
  id: yupString().required(),
}).required();
const oauthProviderConfigSchema = schemaFields.yupUnion(
  yupObject({
    id: yupString().uuid().required(),
    type: yupString().oneOf(sharedProviders).required(),
    shared: schemaFields.yupBoolean().isTrue().required(),
  }).required(),
  yupObject({
    id: yupString().uuid().required(),
    type: yupString().oneOf(standardProviders).required(),
    shared: schemaFields.yupBoolean().isFalse().required(),
    client_id: yupString().required(),
    client_secret: yupString().required(),
    facebook_config_id: yupString().optional().meta({ openapiField: { description: 'This parameter is the configuration id for Facebook business login (for things like ads and marketing).' } }),
    microsoft_tenant_id: yupString().optional().meta({ openapiField: { description: 'This parameter is the Microsoft tenant id for Microsoft directory' } }),
  }).required(),
);

const clientOAuthProviderConfigSchema = yupObject({
  id: yupString().uuid().required(),
  type: yupString().oneOf(allProviders).required(),
}).required();

const authMethodSharedFields = {
  id: yupString().uuid().required(),
  enabled: schemaFields.yupBoolean().required(),
};
const authMethodConfigSchema = schemaFields.yupUnion(
  yupObject({
    ...authMethodSharedFields,
    type: yupString().oneOf(['password']).required(),
  }).required(),
  yupObject({
    ...authMethodSharedFields,
    type: yupString().oneOf(['otp']).required(),
  }).required(),
  yupObject({
    ...authMethodSharedFields,
    type: yupString().oneOf(['oauth']).required(),
    provider_config_id: yupString().required(),
  }).required(),
);

const clientAuthMethodConfigSchema = authMethodConfigSchema;

const connectedAccountConfigSchema = yupObject({
  id: yupString().uuid().required(),
  enabled: schemaFields.yupBoolean().required(),
  provider_id: yupString().required(),
});

const clientConnectedAccountConfigSchema = connectedAccountConfigSchema;

const enabledOAuthProviderSchema = yupObject({
  id: schemaFields.oauthIdSchema.required(),
});

const emailConfigSchema = yupObject({
  type: schemaFields.emailTypeSchema.required(),
  host: yupRequiredWhen(schemaFields.emailHostSchema, 'type', 'standard'),
  port: yupRequiredWhen(schemaFields.emailPortSchema, 'type', 'standard'),
  username: yupRequiredWhen(schemaFields.emailUsernameSchema, 'type', 'standard'),
  password: yupRequiredWhen(schemaFields.emailPasswordSchema, 'type', 'standard'),
  sender_name: yupRequiredWhen(schemaFields.emailSenderNameSchema, 'type', 'standard'),
  sender_email: yupRequiredWhen(schemaFields.emailSenderEmailSchema, 'type', 'standard'),
});

const domainSchema = yupObject({
  domain: schemaFields.projectTrustedDomainSchema.required(),
  handler_path: schemaFields.handlerPathSchema.required(),
});

export const projectsCrudAdminReadSchema = yupObject({
  id: schemaFields.projectIdSchema.required(),
  display_name: schemaFields.projectDisplayNameSchema.required(),
  description: schemaFields.projectDescriptionSchema.nonNullable().defined(),
  created_at_millis: schemaFields.projectCreatedAtMillisSchema.required(),
  user_count: schemaFields.projectUserCountSchema.required(),
  is_production_mode: schemaFields.projectIsProductionModeSchema.required(),
  config: yupObject({
    id: schemaFields.projectConfigIdSchema.required(),
    allow_localhost: schemaFields.projectAllowLocalhostSchema.required(),
    sign_up_enabled: schemaFields.projectSignUpEnabledSchema.required(),
    client_team_creation_enabled: schemaFields.projectClientTeamCreationEnabledSchema.required(),
    client_user_deletion_enabled: schemaFields.projectClientUserDeletionEnabledSchema.required(),
    create_team_on_sign_up: schemaFields.projectCreateTeamOnSignUpSchema.required(),

    team_creator_default_permissions: yupArray(teamPermissionSchema.required()).required(),
    team_member_default_permissions: yupArray(teamPermissionSchema.required()).required(),

    domains: yupArray(domainSchema.required()).required(),
    email_config: emailConfigSchema.required(),

    oauth_provider_configs: yupArray(oauthProviderConfigSchema).required(),
    auth_method_configs: yupArray(authMethodConfigSchema).required(),
    connected_account_configs: yupArray(connectedAccountConfigSchema).required(),
    enabled_oauth_provider_configs: yupArray(clientOAuthProviderConfigSchema).required(),
    enabled_auth_method_configs: yupArray(clientAuthMethodConfigSchema).required(),
    enabled_connected_account_configs: yupArray(clientConnectedAccountConfigSchema).required(),

    // =============
    /* @deprecated */
    credential_enabled: schemaFields.projectCredentialEnabledSchema.required(),
    /* @deprecated */
    magic_link_enabled: schemaFields.projectMagicLinkEnabledSchema.required(),
    /* @deprecated */
    enabled_oauth_providers: yupArray(enabledOAuthProviderSchema.required()).required(),
    // =============
  }).required(),
}).required();

export const projectsCrudClientReadSchema = yupObject({
  id: schemaFields.projectIdSchema.required(),
  display_name: schemaFields.projectDisplayNameSchema.required(),
  config: yupObject({
    sign_up_enabled: schemaFields.projectSignUpEnabledSchema.required(),

    client_team_creation_enabled: schemaFields.projectClientTeamCreationEnabledSchema.required(),
    client_user_deletion_enabled: schemaFields.projectClientUserDeletionEnabledSchema.required(),

    enabled_oauth_provider_configs: yupArray(clientOAuthProviderConfigSchema).required(),
    enabled_auth_method_configs: yupArray(clientAuthMethodConfigSchema).required(),
    enabled_connected_account_configs: yupArray(clientConnectedAccountConfigSchema).required(),

    // ==============
    /* @deprecated */
    credential_enabled: schemaFields.projectCredentialEnabledSchema.required(),
    /* @deprecated */
    magic_link_enabled: schemaFields.projectMagicLinkEnabledSchema.required(),
    /* @deprecated */
    enabled_oauth_providers: yupArray(enabledOAuthProviderSchema.required()).required(),
    // ===============
  }).required(),
}).required();


export const projectsCrudAdminUpdateSchema = yupObject({
  display_name: schemaFields.projectDisplayNameSchema.optional(),
  description: schemaFields.projectDescriptionSchema.optional(),
  is_production_mode: schemaFields.projectIsProductionModeSchema.optional(),
  config: yupObject({
    allow_localhost: schemaFields.projectAllowLocalhostSchema.optional(),
    sign_up_enabled: schemaFields.projectSignUpEnabledSchema.optional(),
    client_team_creation_enabled: schemaFields.projectClientTeamCreationEnabledSchema.optional(),
    client_user_deletion_enabled: schemaFields.projectClientUserDeletionEnabledSchema.optional(),
    create_team_on_sign_up: schemaFields.projectCreateTeamOnSignUpSchema.optional(),

    team_creator_default_permissions: yupArray(teamPermissionSchema.required()).optional(),
    team_member_default_permissions: yupArray(teamPermissionSchema.required()).optional(),

    domains: yupArray(domainSchema.required()).optional().default(undefined),
    email_config: emailConfigSchema.optional().default(undefined),

    oauth_provider_configs: yupArray(oauthProviderConfigSchema).optional().default(undefined),
    auth_method_configs: yupArray(authMethodConfigSchema).optional().default(undefined),
    connected_accounts: yupArray(connectedAccountConfigSchema).optional().default(undefined),
  }).optional().default(undefined),
}).required();

export const projectsCrudAdminCreateSchema = projectsCrudAdminUpdateSchema.concat(yupObject({
  display_name: schemaFields.projectDisplayNameSchema.required(),
}).required());

export const projectsCrudAdminDeleteSchema = schemaFields.yupMixed();

export const projectsCrud = createCrud({
  clientReadSchema: projectsCrudClientReadSchema,
  adminReadSchema: projectsCrudAdminReadSchema,
  adminUpdateSchema: projectsCrudAdminUpdateSchema,
  adminDeleteSchema: projectsCrudAdminDeleteSchema,
  docs: {
    clientRead: {
      summary: 'Get the current project',
      description: 'Get the current project information including display name, oauth providers and authentication methods. Useful for display the available login options to the user.',
      tags: ['Projects'],
    },
    adminRead: {
      summary: 'Get the current project',
      description: 'Get the current project information and configuration including display name, oauth providers, email configuration, etc.',
      tags: ['Projects'],
    },
    adminUpdate: {
      summary: 'Update the current project',
      description: 'Update the current project information and configuration including display name, oauth providers, email configuration, etc.',
      tags: ['Projects'],
    },
    adminDelete: {
      summary: 'Delete the current project',
      description: 'Delete the current project and all associated data (including users, teams, API keys, project configs, etc.). Be careful, this action is irreversible.',
      tags: ['Projects'],
    },
  },
});
export type ProjectsCrud = CrudTypeOf<typeof projectsCrud>;

export const internalProjectsCrud = createCrud({
  clientReadSchema: projectsCrudAdminReadSchema,
  clientCreateSchema: projectsCrudAdminCreateSchema,
  docs: {
    clientList: {
      hidden: true,
    },
    clientCreate: {
      hidden: true,
    },
  },
});
export type InternalProjectsCrud = CrudTypeOf<typeof internalProjectsCrud>;
