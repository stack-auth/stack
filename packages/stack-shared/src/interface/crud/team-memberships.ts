import { CrudTypeOf, createCrud } from "../../crud";
import { yupMixed, yupObject } from "../../schema-fields";

export const teamMembershipsCrudClientReadSchema = yupObject({}).required();
export const teamMembershipsCrudServerCreateSchema = yupObject({}).required();
export const teamMembershipsCrudClientDeleteSchema = yupMixed();

export const teamMembershipsCrud = createCrud({
  // Client
  clientReadSchema: teamMembershipsCrudClientReadSchema,
  clientDeleteSchema: teamMembershipsCrudClientDeleteSchema,
  // Server
  serverCreateSchema: teamMembershipsCrudServerCreateSchema,
  docs: {
    serverCreate: {
      summary: "Add a user to a team",
      description: "",
      tags: ["Teams"],
    },
    clientDelete: {
      summary: "Remove a user from a team",
      description:
        "All the users are allowed to remove themselves from a team (`user_id=me`). Only the users who have the `$remove_members` permission are allowed to remove other users from a team. `team_id` is must an ID of a team that the user is a member of.",
      tags: ["Teams"],
    },
    serverDelete: {
      summary: "Remove a user from a team",
      description: "",
      tags: ["Teams"],
    },
  },
});
export type TeamMembershipsCrud = CrudTypeOf<typeof teamMembershipsCrud>;
