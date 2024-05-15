import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";

export const usersCrudServerUpdateSchema = yup.object({
  displayName: yup.string().optional(),
  clientMetadata: yup.object().optional(),
  serverMetadata: yup.object().optional(),
  primaryEmail: yup.string().optional(),
  primaryEmailVerified: yup.boolean().optional(),
}).required();

export const usersCrudServerReadSchema = yup.object({
  projectId: yup.string().required(),
  id: yup.string().required(),
  primaryEmail: yup.string().nullable().defined(),
  primaryEmailVerified: yup.boolean().required(),
  displayName: yup.string().nullable().defined(),
  clientMetadata: yup.object().nullable().defined().transform((value) => JSON.parse(JSON.stringify(value))),
  profileImageUrl: yup.string().nullable().defined(),
  signedUpAtMillis: yup.number().required(),
  /**
   * not used anymore, for backwards compatibility
   */
  authMethod: yup.string().oneOf(["credential", "oauth"]).required(),
  hasPassword: yup.boolean().required(),
  authWithEmail: yup.boolean().required(),
  oauthProviders: yup.array(yup.string().required()).required(),
  serverMetadata: yup.object().nullable().defined().transform((value) => JSON.parse(JSON.stringify(value))),
}).required();

const serverDeleteSchema = yup.mixed();

export const usersCrud = createCrud({
  serverReadSchema: usersCrudServerReadSchema,
  serverUpdateSchema: usersCrudServerUpdateSchema,
  serverDeleteSchema,
});
export type UsersCrud = CrudTypeOf<typeof usersCrud>;
