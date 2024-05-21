import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";
import { usersCrudServerReadSchema, usersCrudServerUpdateSchema } from "./users";

const clientUpdateSchema = usersCrudServerUpdateSchema.pick([
  "displayName",
  "clientMetadata",
  "selectedTeamId",
]).required();

const serverUpdateSchema = usersCrudServerUpdateSchema;

const clientReadSchema = usersCrudServerReadSchema.pick([
  "projectId",
  "id",
  "primaryEmail",
  "primaryEmailVerified",
  "displayName",
  "clientMetadata",
  "profileImageUrl",
  "signedUpAtMillis",
  "authMethod",
  "hasPassword",
  "authWithEmail",
  "oauthProviders",
  "selectedTeamId",
]).nullable().defined();

const serverReadSchema = usersCrudServerReadSchema.nullable().defined();

export const currentUserCrud = createCrud({
  clientReadSchema,
  serverReadSchema,
  clientUpdateSchema,
  serverUpdateSchema,
});
export type CurrentUserCrud = CrudTypeOf<typeof currentUserCrud>;
