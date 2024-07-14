import { CrudTypeOf, createCrud } from "../../crud";
import { yupArray, yupBoolean, yupNumber, yupObject, yupRequiredWhen, yupString } from "../../schema-fields";

const teamPermissionSchema = yupObject({
  id: yupString().required(),
}).required();

const oauthProviderSchema = yupObject({
  id: yupString().oneOf(['google', 'github', 'facebook', 'microsoft', 'spotify']).required(),
  enabled: yupBoolean().required(),
  type: yupString().oneOf(['shared', 'standard']).required(),
  client_id: yupRequiredWhen(yupString(), 'type', 'standard'),
  client_secret: yupRequiredWhen(yupString(), 'type', 'standard'),
});

const emailConfigSchema = yupObject({
  type: yupString().oneOf(['shared', 'standard']).required(),
  sender_name: yupRequiredWhen(yupString(), 'type', 'standard'),
  host: yupRequiredWhen(yupString(), 'type', 'standard'),
  port: yupRequiredWhen(yupNumber(), 'type', 'standard'),
  username: yupRequiredWhen(yupString(), 'type', 'standard'),
  password: yupRequiredWhen(yupString(), 'type', 'standard'),
  sender_email: yupRequiredWhen(yupString().email(), 'type', 'standard'),
});

const domainSchema = yupObject({
  domain: yupString().required(),
  handler_path: yupString().required(),
});

export const projectsCrudAdminReadSchema = yupObject({
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
    team_creator_default_permissions: yupArray(teamPermissionSchema.required()).required(),
    team_member_default_permissions: yupArray(teamPermissionSchema.required()).required(),
  }).required(),
}).required();

export const projectsCrudClientReadSchema = yupObject({
  id: yupString().required(),
  display_name: yupString().required(),
  config: yupObject({
    credential_enabled: yupBoolean().required(),
    magic_link_enabled: yupBoolean().required(),
    oauth_providers: yupArray(yupObject({
      id: yupString().required(),
    }).required()).required(),
  }).required(),
}).required();


export const projectsCrudAdminUpdateSchema = yupObject({
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
    team_creator_default_permissions: yupArray(teamPermissionSchema.required()).optional(),
    team_member_default_permissions: yupArray(teamPermissionSchema.required()).optional(),
  }).optional().default(undefined),
}).required();

export const projectsCrudAdminCreateSchema = projectsCrudAdminUpdateSchema.concat(yupObject({
  display_name: yupString().required(),
}).required());

export const projectsCrud = createCrud({
  clientReadSchema: projectsCrudClientReadSchema,
  adminReadSchema: projectsCrudAdminReadSchema,
  adminUpdateSchema: projectsCrudAdminUpdateSchema,
  docs: {
    adminRead: {
      hidden: true,
    },
    adminUpdate: {
      hidden: true,
    },
  },
});
export type ProjectsCrud = CrudTypeOf<typeof projectsCrud>;

export const internalProjectsCrud = createCrud({
  clientReadSchema: projectsCrudAdminReadSchema,
  clientCreateSchema: projectsCrudAdminCreateSchema,
  docs: {
    clientRead: {
      hidden: true,
    },
    clientCreate: {
      hidden: true,
    },
  },
});
export type InternalProjectsCrud = CrudTypeOf<typeof internalProjectsCrud>;
