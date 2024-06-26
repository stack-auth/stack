import { CrudTypeOf, createCrud } from "../../crud";
import { usersCrudServerReadSchema, usersCrudServerUpdateSchema, usersCrudServerDeleteSchema } from "./users";

const clientUpdateSchema = usersCrudServerUpdateSchema.pick([
  "display_name",
  "client_metadata",
  "selected_team_id",
]).required();

const serverUpdateSchema = usersCrudServerUpdateSchema;

const clientReadSchema = usersCrudServerReadSchema.pick([
  "project_id",
  "id",
  "primary_email",
  "primary_email_verified",
  "display_name",
  "client_metadata",
  "profile_image_url",
  "signed_up_at_millis",
  "auth_method",
  "has_password",
  "auth_with_email",
  "oauth_providers",
  "selected_team_id",
  "selected_team",
]).nullable().defined();

const serverReadSchema = usersCrudServerReadSchema.nullable().defined();

const serverDeleteSchema = usersCrudServerDeleteSchema;

export const currentUserCrud = createCrud({
  clientReadSchema,
  serverReadSchema,
  clientUpdateSchema,
  serverUpdateSchema,
  serverDeleteSchema,
});
export type CurrentUserCrud = CrudTypeOf<typeof currentUserCrud>;
