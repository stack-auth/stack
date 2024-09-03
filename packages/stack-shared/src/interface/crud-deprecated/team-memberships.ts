import { CrudTypeOf, createCrud } from "../../crud";
import { yupMixed, yupObject } from "../../schema-fields";

export const teamMembershipsCrudServerReadSchema = yupObject({}).required();

export const teamMembershipsCrudServerCreateSchema = yupObject({}).required();

export const teamMembershipsCrudServerDeleteSchema = yupMixed();

export const teamMembershipsCrud = createCrud({
  serverReadSchema: teamMembershipsCrudServerReadSchema,
  serverCreateSchema: teamMembershipsCrudServerCreateSchema,
  serverDeleteSchema: teamMembershipsCrudServerDeleteSchema,
  docs: {
    serverCreate: {
      summary: "Add a user to a team",
      description: "",
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
