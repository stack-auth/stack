import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";
import { yupObject, yupString, yupNumber, yupBoolean, yupArray, yupMixed } from "../../schema-fields";

function requiredWhen<S extends yup.AnyObject>(
  schema: S, 
  triggerName: string,
  isValue: any
): S {
  return schema.when(triggerName, {
    is: isValue,
    then: (schema: S) => schema.required(),
    otherwise: (schema: S) => schema.optional()
  });
}

const teamSystemPermissions = [
  '$update_team',
  '$delete_team',
  '$read_members',
  '$remove_members',
  '$invite_members',
] as const;

export const teamPermissionIdSchema = yupString()
  .matches(/^\$?[a-z0-9_:]+$/, 'Only lowercase letters, numbers, ":", "_" and optional "$" at the beginning are allowed')
  .test('is-system-permission', 'System permissions must start with a dollar sign', (value, ctx) => {
    if (!value) return true;
    if (value.startsWith('$') && !teamSystemPermissions.includes(value as any)) {
      return ctx.createError({ message: 'Invalid system permission' });
    }
    return true;
  });

export const permissionSchema = yupObject({
  id: yupString().required(),
  scope: yupString().required(),
}).required();

export const oauthProviderSchema = yupObject({
  id: yupString().oneOf(['google', 'github', 'facebook', 'microsoft', 'spotify']).required(),
  enabled: yupBoolean().required(),
  type: yupString().oneOf(['shared', 'standard']).required(),
  client_id: requiredWhen(yupString(), 'type', 'standard'),
  client_secret: requiredWhen(yupString(), 'type', 'standard'),
});

export const emailConfigSchema = yupObject({
  type: yupString().oneOf(['shared', 'standard']).required(),
  sender_name: requiredWhen(yupString(), 'type', 'standard'),
  host: requiredWhen(yupString(), 'type', 'standard'),
  port: requiredWhen(yupNumber(), 'type', 'standard'),
  username: requiredWhen(yupString(), 'type', 'standard'),
  password: requiredWhen(yupString(), 'type', 'standard'),
  sender_email: requiredWhen(yupString().email(), 'type', 'standard'),
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
  id: yupString().required(),
  display_name: yupString().required(),
  description: yupString().optional(),
  config: yupObject({
    credential_enabled: yupBoolean().required(),
    magic_link_enabled: yupBoolean().required(),
    oauth_providers: yupArray(yupObject({
      id: yupString().required(),
    }).required()).required(),
  }).required(),
}).required();

export const projectsCrud = createCrud({
  clientReadSchema: projectsCrudClientReadSchema,
  docs: {
    clientRead: {
      tags: ["Projects"],
      summary: 'Get project',
      description: 'Get the project information, useful for deciding which auth methods to show to the user in the frontend.',
    },
  },
});
export type projectCrud = CrudTypeOf<typeof projectsCrud>;