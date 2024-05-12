import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";

const clientUpdateSchema = yup.object({
  displayName: yup.string().optional(),
  clientMetadata: yup.object().optional(),
}).required();

const serverUpdateSchema = clientUpdateSchema.concat(yup.object({
  serverMetadata: yup.object().optional(),
  primaryEmail: yup.string().optional(),
  primaryEmailVerified: yup.boolean().optional(),
})).required();

const clientReadSchema = yup.object({
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
}).nullable().defined();

const serverReadSchema = clientReadSchema.concat(yup.object({
  serverMetadata: yup.object().nullable().defined().transform((value) => JSON.parse(JSON.stringify(value))),
})).nullable().defined();

export const currentUserCrud = createCrud({
  clientReadSchema,
  serverReadSchema,
  clientUpdateSchema,
  serverUpdateSchema,
});
export type CurrentUserCrud = CrudTypeOf<typeof currentUserCrud>;
