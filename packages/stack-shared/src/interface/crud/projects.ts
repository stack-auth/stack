import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";

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

export const teamPermissionIdSchema = yup.string()
  .matches(/^\$?[a-z0-9_:]+$/, 'Only lowercase letters, numbers, ":", "_" and optional "$" at the beginning are allowed')
  .test('is-system-permission', 'System permissions must start with a dollar sign', (value, ctx) => {
    if (!value) return true;
    if (value.startsWith('$') && !teamSystemPermissions.includes(value as any)) {
      return ctx.createError({ message: 'Invalid system permission' });
    }
    return true;
  });

export const permissionSchema = yup.object({
  id: yup.string().required(),
  scope: yup.string().required(),
}).required();

export const oauthProviderSchema = yup.object({
  id: yup.string().oneOf(['google', 'github', 'facebook', 'microsoft', 'spotify']).required(),
  enabled: yup.boolean().required(),
  type: yup.string().oneOf(['shared', 'standard']).required(),
  client_id: requiredWhen(yup.string(), 'type', 'standard'),
  client_secret: requiredWhen(yup.string(), 'type', 'standard'),
});

export const emailConfigSchema = yup.object({
  type: yup.string().oneOf(['shared', 'standard']).required(),
  sender_name: requiredWhen(yup.string(), 'type', 'standard'),
  host: requiredWhen(yup.string(), 'type', 'standard'),
  port: requiredWhen(yup.number(), 'type', 'standard'),
  username: requiredWhen(yup.string(), 'type', 'standard'),
  password: requiredWhen(yup.string(), 'type', 'standard'),
  sender_email: requiredWhen(yup.string().email(), 'type', 'standard'),
});

export const domainSchema = yup.object({
  domain: yup.string().required(),
  handler_path: yup.string().required(),
});

// export const projectsCrudClientReadSchema = yup.object({
//   id: yup.string().required(),
//   evaluated_config: yup.object({
//     credential_enabled: yup.boolean().required(),
//     magic_link_enabled: yup.boolean().required(),
//     oauth_providers: yup.array(yup.object({
//       id: yup.string().required(),
//       enabled: yup.boolean().required(),
//     }).required()).required(),
//   }).required(),
// }).required();

export const projectsCrudClientReadSchema = yup.object({
  id: yup.string().required(),
  display_name: yup.string().required(),
  description: yup.string().optional(),
  created_at_millis: yup.number().required(),
  user_count: yup.number().required(),
  is_production_mode: yup.boolean().required(),
  config: yup.object({
    id: yup.string().required(),
    allow_localhost: yup.boolean().required(),
    credential_enabled: yup.boolean().required(),
    magic_link_enabled: yup.boolean().required(),
    oauth_providers: yup.array(oauthProviderSchema.required()).required(),
    domains: yup.array(domainSchema.required()).required(),
    email_config: emailConfigSchema.required(),
    team_creator_default_permissions: yup.array(permissionSchema.required()).optional(),
    team_member_default_permissions: yup.array(permissionSchema.required()).optional(),
  }).required(),
}).required();

export const projectsCrudClientUpdateSchema = yup.object({
  description: yup.string().optional(),
  is_production_mode: yup.boolean().optional(),
  config: yup.object({
    credential_enabled: yup.boolean().optional(),
    magic_link_enabled: yup.boolean().optional(),
    allow_localhost: yup.boolean().optional(),
    create_team_on_sign_up: yup.boolean().optional(),
    email_config: emailConfigSchema.optional().default(undefined),
    domains: yup.array(domainSchema.required()).optional().default(undefined),
    oauth_providers: yup.array(oauthProviderSchema.required()).optional().default(undefined),
    team_creator_default_permission_ids: yup.array(teamPermissionIdSchema.required()).optional().default(undefined),
    team_member_default_permission_ids: yup.array(teamPermissionIdSchema.required()).optional().default(undefined),
  }).optional().default(undefined),
}).required();

export const projectsCrudClientCreateSchema = projectsCrudClientUpdateSchema.concat(yup.object({
  display_name: yup.string().required(),
}).required());

export const projectsCrudClientDeleteSchema = yup.mixed();

export const projectsCrud = createCrud({
  clientReadSchema: projectsCrudClientReadSchema,
  clientUpdateSchema: projectsCrudClientUpdateSchema,
  clientCreateSchema: projectsCrudClientCreateSchema,
  clientDeleteSchema: projectsCrudClientDeleteSchema,
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
export type UsersCrud = CrudTypeOf<typeof projectsCrud>;
