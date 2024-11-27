import { CrudTypeOf, createCrud } from "../../crud";
import * as schemaFields from "../../schema-fields";
import { yupArray, yupDefinedWhen, yupObject, yupString } from "../../schema-fields";

const teamPermissionSchema = yupObject({
  id: yupString().defined(),
}).defined();

const oauthProviderSchema = yupObject({
  id: schemaFields.oauthIdSchema.defined(),
  enabled: schemaFields.oauthEnabledSchema.defined(),
  type: schemaFields.oauthTypeSchema.defined(),
  client_id: yupDefinedWhen(schemaFields.oauthClientIdSchema, 'type', 'standard'),
  client_secret: yupDefinedWhen(schemaFields.oauthClientSecretSchema, 'type', 'standard'),

  // extra params
  facebook_config_id: schemaFields.oauthFacebookConfigIdSchema.optional(),
  microsoft_tenant_id: schemaFields.oauthMicrosoftTenantIdSchema.optional(),
});

const enabledOAuthProviderSchema = yupObject({
  id: schemaFields.oauthIdSchema.defined(),
});

const emailConfigSchema = yupObject({
  type: schemaFields.emailTypeSchema.defined(),
  host: yupDefinedWhen(schemaFields.emailHostSchema, 'type', 'standard'),
  port: yupDefinedWhen(schemaFields.emailPortSchema, 'type', 'standard'),
  username: yupDefinedWhen(schemaFields.emailUsernameSchema, 'type', 'standard'),
  password: yupDefinedWhen(schemaFields.emailPasswordSchema, 'type', 'standard'),
  sender_name: yupDefinedWhen(schemaFields.emailSenderNameSchema, 'type', 'standard'),
  sender_email: yupDefinedWhen(schemaFields.emailSenderEmailSchema, 'type', 'standard'),
});

const domainSchema = yupObject({
  domain: schemaFields.projectTrustedDomainSchema.defined(),
  handler_path: schemaFields.handlerPathSchema.defined(),
});

export const projectsCrudAdminReadSchema = yupObject({
  id: schemaFields.projectIdSchema.defined(),
  display_name: schemaFields.projectDisplayNameSchema.defined(),
  description: schemaFields.projectDescriptionSchema.nonNullable().defined(),
  created_at_millis: schemaFields.projectCreatedAtMillisSchema.defined(),
  user_count: schemaFields.projectUserCountSchema.defined(),
  is_production_mode: schemaFields.projectIsProductionModeSchema.defined(),
  config: yupObject({
    id: schemaFields.projectConfigIdSchema.defined(),
    allow_localhost: schemaFields.projectAllowLocalhostSchema.defined(),
    sign_up_enabled: schemaFields.projectSignUpEnabledSchema.defined(),
    credential_enabled: schemaFields.projectCredentialEnabledSchema.defined(),
    magic_link_enabled: schemaFields.projectMagicLinkEnabledSchema.defined(),
    passkey_enabled: schemaFields.projectPasskeyEnabledSchema.defined(),
    // TODO: remove this
    legacy_global_jwt_signing: schemaFields.yupBoolean().defined(),
    client_team_creation_enabled: schemaFields.projectClientTeamCreationEnabledSchema.defined(),
    client_user_deletion_enabled: schemaFields.projectClientUserDeletionEnabledSchema.defined(),
    oauth_providers: yupArray(oauthProviderSchema.defined()).defined(),
    enabled_oauth_providers: yupArray(enabledOAuthProviderSchema.defined()).defined().meta({ openapiField: { hidden: true } }),
    domains: yupArray(domainSchema.defined()).defined(),
    email_config: emailConfigSchema.defined(),
    create_team_on_sign_up: schemaFields.projectCreateTeamOnSignUpSchema.defined(),
    team_creator_default_permissions: yupArray(teamPermissionSchema.defined()).defined(),
    team_member_default_permissions: yupArray(teamPermissionSchema.defined()).defined(),
  }).defined(),
}).defined();

export const projectsCrudClientReadSchema = yupObject({
  id: schemaFields.projectIdSchema.defined(),
  display_name: schemaFields.projectDisplayNameSchema.defined(),
  config: yupObject({
    sign_up_enabled: schemaFields.projectSignUpEnabledSchema.defined(),
    credential_enabled: schemaFields.projectCredentialEnabledSchema.defined(),
    magic_link_enabled: schemaFields.projectMagicLinkEnabledSchema.defined(),
    passkey_enabled: schemaFields.projectPasskeyEnabledSchema.defined(),
    client_team_creation_enabled: schemaFields.projectClientTeamCreationEnabledSchema.defined(),
    client_user_deletion_enabled: schemaFields.projectClientUserDeletionEnabledSchema.defined(),
    enabled_oauth_providers: yupArray(enabledOAuthProviderSchema.defined()).defined().meta({ openapiField: { hidden: true } }),
  }).defined(),
}).defined();


export const projectsCrudAdminUpdateSchema = yupObject({
  display_name: schemaFields.projectDisplayNameSchema.optional(),
  description: schemaFields.projectDescriptionSchema.optional(),
  is_production_mode: schemaFields.projectIsProductionModeSchema.optional(),
  config: yupObject({
    sign_up_enabled: schemaFields.projectSignUpEnabledSchema.optional(),
    credential_enabled: schemaFields.projectCredentialEnabledSchema.optional(),
    magic_link_enabled: schemaFields.projectMagicLinkEnabledSchema.optional(),
    passkey_enabled: schemaFields.projectPasskeyEnabledSchema.optional(),
    client_team_creation_enabled: schemaFields.projectClientTeamCreationEnabledSchema.optional(),
    client_user_deletion_enabled: schemaFields.projectClientUserDeletionEnabledSchema.optional(),
    legacy_global_jwt_signing: schemaFields.yupBoolean().isFalse().optional(),
    allow_localhost: schemaFields.projectAllowLocalhostSchema.optional(),
    email_config: emailConfigSchema.optional().default(undefined),
    domains: yupArray(domainSchema.defined()).optional().default(undefined),
    oauth_providers: yupArray(oauthProviderSchema.defined()).optional().default(undefined),
    create_team_on_sign_up: schemaFields.projectCreateTeamOnSignUpSchema.optional(),
    team_creator_default_permissions: yupArray(teamPermissionSchema.defined()).optional(),
    team_member_default_permissions: yupArray(teamPermissionSchema.defined()).optional(),
  }).optional().default(undefined),
}).defined();

export const projectsCrudAdminCreateSchema = projectsCrudAdminUpdateSchema.concat(yupObject({
  display_name: schemaFields.projectDisplayNameSchema.defined(),
}).defined());

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
