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
  uploadedProfileImage:yup.string().nullable().optional(),
}).required();

export const usersCrudServerReadSchema = yup.object({
  projectId: yup.string().required(),
  id: yup.string().required(),
  primaryEmail: yup.string().nullable().defined(),
  primaryEmailVerified: yup.boolean().required(),
  displayName: yup.string().nullable().defined(),
  clientMetadata: yupJson,
  selectedTeamId: yup.string().nullable().defined(),
  profileImageUrl: yup.string().nullable().defined(),
  signedUpAtMillis: yup.number().required(),
  uploadedProfileImageId:yup.string().nullable().optional(),
  /**
   * not used anymore, for backwards compatibility
   */
  authMethod: yup.string().oneOf(["credential", "oauth"]).required(),
  hasPassword: yup.boolean().required(),
  authWithEmail: yup.boolean().required(),
  oauthProviders: yup.array(yup.string().required()).required(),
  serverMetadata: yupJson,
}).required();

const serverDeleteSchema = yup.mixed();

export const usersCrud = createCrud({
  serverReadSchema: usersCrudServerReadSchema,
  serverUpdateSchema: usersCrudServerUpdateSchema,
  serverDeleteSchema,
});
export type UsersCrud = CrudTypeOf<typeof usersCrud>;
