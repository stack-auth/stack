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
    serverDelete: {
      summary: "Remove a user from a team",
      description: "",
      tags: ["Teams"],
    },
  },
});
export type TeamMembershipsCrud = CrudTypeOf<typeof teamMembershipsCrud>;