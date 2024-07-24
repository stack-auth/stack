import { CrudTypeOf, createCrud } from "../../crud";
import { yupMixed, yupObject } from "../../schema-fields";

// Read
export const teamMembershipsCrudClientReadSchema = yupObject({}).required();
export const teamMembershipsCrudServerReadSchema = yupObject({}).required();

// Create
export const teamMembershipsCrudServerCreateSchema = yupObject({}).required();

// Delete
export const teamMembershipsCrudClientDeleteSchema = yupMixed();
export const teamMembershipsCrudServerDeleteSchema = yupMixed();

export const teamMembershipsCrud = createCrud({
  // Client
  clientReadSchema: teamMembershipsCrudClientReadSchema,
  clientDeleteSchema: teamMembershipsCrudClientDeleteSchema,
  // Server
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