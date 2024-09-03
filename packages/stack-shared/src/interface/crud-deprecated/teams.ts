import { CrudTypeOf, createCrud } from "../../crud";
import * as fieldSchema from "../../schema-fields";
import { yupMixed, yupObject } from "../../schema-fields";

// Read
export const teamsCrudClientReadSchema = yupObject({
  id: fieldSchema.teamIdSchema.required(),
  display_name: fieldSchema.teamDisplayNameSchema.required(),
}).required();
export const teamsCrudServerReadSchema = teamsCrudClientReadSchema.concat(
  yupObject({
    created_at_millis: fieldSchema.teamCreatedAtMillisSchema.required(),
  }).required(),
);

// Update
export const teamsCrudClientUpdateSchema = yupObject({
  display_name: fieldSchema.teamDisplayNameSchema.optional(),
}).required();
export const teamsCrudServerUpdateSchema = teamsCrudClientUpdateSchema.concat(yupObject({}).required());

// Create
export const teamsCrudClientCreateSchema = teamsCrudClientUpdateSchema.concat(
  yupObject({
    display_name: fieldSchema.teamDisplayNameSchema.required(),
  }).required(),
);
export const teamsCrudServerCreateSchema = teamsCrudServerUpdateSchema.concat(
  yupObject({
    display_name: fieldSchema.teamDisplayNameSchema.required(),
  }).required(),
);

// Delete
export const teamsCrudClientDeleteSchema = yupMixed();
export const teamsCrudServerDeleteSchema = teamsCrudClientDeleteSchema;

export const teamsCrud = createCrud({
  clientReadSchema: teamsCrudClientReadSchema,
  // clientUpdateSchema: teamsCrudClientUpdateSchema,
  clientCreateSchema: teamsCrudClientCreateSchema,
  // clientDeleteSchema: teamsCrudClientDeleteSchema,
  serverReadSchema: teamsCrudServerReadSchema,
  serverUpdateSchema: teamsCrudServerUpdateSchema,
  serverCreateSchema: teamsCrudServerCreateSchema,
  serverDeleteSchema: teamsCrudServerDeleteSchema,
  docs: {
    clientList: {
      summary: "List teams",
      description: "List all the teams that the current user is a member of.",
      tags: ["Teams"],
    },
    clientCreate: {
      summary: "Create a team",
      description: "Create a new team and add the current user as a member.",
      tags: ["Teams"],
    },
    clientRead: {
      summary: "Get a team",
      description: "Get a team that the current user is a member of.",
      tags: ["Teams"],
    },
    serverCreate: {
      summary: "Create a team",
      description: "Create a new team and add the current user as a member.",
      tags: ["Teams"],
    },
    serverList: {
      summary: "List teams",
      description: "List all the teams in the project.",
      tags: ["Teams"],
    },
    serverRead: {
      summary: "Get a team",
      description: "Get a team by ID.",
      tags: ["Teams"],
    },
    serverUpdate: {
      summary: "Update a team",
      description: "Update a team by ID.",
      tags: ["Teams"],
    },
    serverDelete: {
      summary: "Delete a team",
      description: "Delete a team by ID.",
      tags: ["Teams"],
    },
  },
});
export type TeamsCrud = CrudTypeOf<typeof teamsCrud>;
