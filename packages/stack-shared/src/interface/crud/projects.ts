import { CrudTypeOf, createCrud } from "../../crud";
import { yupObject, yupString, yupNumber, yupBoolean, yupArray, yupMixed, yupRequiredWhen, teamPermissionIdSchema } from "../../schema-fields";
import * as fieldSchema from "../../schema-fields";

export const permissionSchema = yupObject({
  id: yupString().required(),
  scope: yupString().required(),
}).required();

export const oauthProviderSchema = yupObject({
  id: yupString().oneOf(['google', 'github', 'facebook', 'microsoft', 'spotify']).required(),
  enabled: yupBoolean().required(),
  type: yupString().oneOf(['shared', 'standard']).required(),
  client_id: yupRequiredWhen(yupString(), 'type', 'standard'),
  client_secret: yupRequiredWhen(yupString(), 'type', 'standard'),
});

export const emailConfigSchema = yupObject({
  type: yupString().oneOf(['shared', 'standard']).required(),
  sender_name: yupRequiredWhen(yupString(), 'type', 'standard'),
  host: yupRequiredWhen(yupString(), 'type', 'standard'),
  port: yupRequiredWhen(yupNumber(), 'type', 'standard'),
  username: yupRequiredWhen(yupString(), 'type', 'standard'),
  password: yupRequiredWhen(yupString(), 'type', 'standard'),
  sender_email: yupRequiredWhen(yupString().email(), 'type', 'standard'),
});

export const domainSchema = yupObject({
  domain: yupString().required(),
  handler_path: yupString().required(),
});

export const internalProjectsCrudClientReadSchema = yupObject({
  id: yupString().required(),
  display_name: yupString().required(),
  description: yupString().optional(),
  created_at_millis: yupNumber().required(),
  user_count: yupNumber().required(),
  is_production_mode: yupBoolean().required(),
  config: yupObject({
    id: yupString().required(),
    allow_localhost: yupBoolean().required(),
    credential_enabled: yupBoolean().required(),
    magic_link_enabled: yupBoolean().required(),
    oauth_providers: yupArray(oauthProviderSchema.required()).required(),
    domains: yupArray(domainSchema.required()).required(),
    email_config: emailConfigSchema.required(),
    team_creator_default_permissions: yupArray(permissionSchema.required()).optional(),
    team_member_default_permissions: yupArray(permissionSchema.required()).optional(),
  }).required(),
}).required();

export const internalProjectsCrudClientUpdateSchema = yupObject({
  display_name: yupString().optional(),
  description: yupString().optional(),
  is_production_mode: yupBoolean().optional(),
  config: yupObject({
    credential_enabled: yupBoolean().optional(),
    magic_link_enabled: yupBoolean().optional(),
    allow_localhost: yupBoolean().optional(),
    create_team_on_sign_up: yupBoolean().optional(),
    email_config: emailConfigSchema.optional().default(undefined),
    domains: yupArray(domainSchema.required()).optional().default(undefined),
    oauth_providers: yupArray(oauthProviderSchema.required()).optional().default(undefined),
    team_creator_default_permission_ids: yupArray(teamPermissionIdSchema.required()).optional().default(undefined),
    team_member_default_permission_ids: yupArray(teamPermissionIdSchema.required()).optional().default(undefined),
  }).optional().default(undefined),
}).required();

export const internalProjectsCrudClientCreateSchema = internalProjectsCrudClientUpdateSchema.concat(yupObject({
  display_name: yupString().required(),
}).required());

export const internalProjectsCrudClientDeleteSchema = yupMixed();

export const internalProjectsCrud = createCrud({
  clientReadSchema: internalProjectsCrudClientReadSchema,
  clientUpdateSchema: internalProjectsCrudClientUpdateSchema,
  clientCreateSchema: internalProjectsCrudClientCreateSchema,
  clientDeleteSchema: internalProjectsCrudClientDeleteSchema,
  docs: {
    clientCreate: {
      hidden: true,
    },
    clientRead: {
      hidden: true,
    },
    clientUpdate: {
      hidden: true,
    },
    clientDelete: {
      hidden: true,
    },
    clientList: {
      hidden: true,
    },
  },
});
export type InternalProjectCrud = CrudTypeOf<typeof internalProjectsCrud>;

export const projectsCrudClientReadSchema = yupObject({
  id: fieldSchema.projectIdSchema.required(),
  display_name: fieldSchema.projectDisplayNameSchema.required(),
  config: yupObject({
    credential_enabled: fieldSchema.projectCredentialEnabledConfigSchema.required(),
    magic_link_enabled: fieldSchema.magicLinkEnabledConfigSchema.required(),
    oauth_providers: yupArray(yupObject({
      id: yupString().required(),
    }).required()).required().meta({ openapiField: { description: 'A list of enabled OAuth providers connected to this account', exampleValue: [{ id: 'google' }, { id: 'github' }] } }),
  }).required()
}).required();

export const projectsCrud = createCrud({
  clientReadSchema: projectsCrudClientReadSchema,
  docs: {
    clientRead: {
      tags: ["Projects"],
      summary: 'Get current project',
      description: 'Get the project information. This is useful for deciding which auth methods to show to the user in the frontend.',
    },
  },
});
export type projectCrud = CrudTypeOf<typeof projectsCrud>;