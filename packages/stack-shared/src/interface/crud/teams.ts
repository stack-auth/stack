import { CrudTypeOf, createCrud } from "../../crud";
import { yupObject, yupString, yupNumber, yupMixed } from "../../schema-fields";

// Read
export const teamsCrudClientReadSchema = yupObject({
  id: yupString().required(),
  display_name: yupString().required(),
}).required();
export const teamsCrudServerReadSchema = teamsCrudClientReadSchema.concat(yupObject({
  created_at_millis: yupNumber().required(),
}).required());

// Update
export const teamsCrudClientUpdateSchema = yupObject({
  display_name: yupString().optional(),
}).required();
export const teamsCrudServerUpdateSchema = teamsCrudClientUpdateSchema.concat(yupObject({
}).required());

// Create
export const teamsCrudClientCreateSchema = teamsCrudClientUpdateSchema.concat(yupObject({
  display_name: yupString().required(),
}).required());
export const teamsCrudServerCreateSchema = teamsCrudServerUpdateSchema.concat(yupObject({
  display_name: yupString().required(),
}).required());

// Delete
export const teamsCrudClientDeleteSchema = yupMixed();
export const teamsCrudServerDeleteSchema = teamsCrudClientDeleteSchema;

export const teamsCrud = createCrud({
  clientReadSchema: teamsCrudClientReadSchema,
  clientUpdateSchema: teamsCrudClientUpdateSchema,
  clientCreateSchema: teamsCrudClientCreateSchema,
  clientDeleteSchema: teamsCrudClientDeleteSchema,
  docs: {
    clientCreate: {
      hidden: true,
    },
    clientRead: {
      hidden: true,
    },
    clientUpdate: {
      hidden: true,
    },
    clientDelete: {
      hidden: true,
    },
    clientList: {
      hidden: true,
    },
  },
});
export type TeamsCrud = CrudTypeOf<typeof teamsCrud>;