import { CrudTypeOf, createCrud } from "../../crud";
import { contactChannelIdSchema, contactChannelIsPrimarySchema, contactChannelIsVerifiedSchema, contactChannelTypeSchema, contactChannelUsedForAuthSchema, contactChannelValueSchema, userIdOrMeSchema, userIdSchema, yupMixed, yupObject } from "../../schema-fields";

export const contactChannelsClientReadSchema = yupObject({
  user_id: userIdSchema.required(),
  id: contactChannelIdSchema.required(),
  value: contactChannelValueSchema.required(),
  type: contactChannelTypeSchema.required(),
  used_for_auth: contactChannelUsedForAuthSchema.required(),
  is_verified: contactChannelIsVerifiedSchema.required(),
  is_primary: contactChannelIsPrimarySchema.required(),
}).required();

export const contactChannelsCrudClientUpdateSchema = yupObject({
  value: contactChannelValueSchema.optional(),
  type: contactChannelTypeSchema.optional(),
  used_for_auth: contactChannelUsedForAuthSchema.optional(),
  is_primary: contactChannelIsPrimarySchema.optional(),
}).required();

export const contactChannelsCrudServerUpdateSchema = contactChannelsCrudClientUpdateSchema.concat(yupObject({
  is_verified: contactChannelIsVerifiedSchema.optional(),
}));

export const contactChannelsCrudClientCreateSchema = yupObject({
  user_id: userIdOrMeSchema.required(),
  value: contactChannelValueSchema.required(),
  type: contactChannelTypeSchema.required(),
  used_for_auth: contactChannelUsedForAuthSchema.required(),
  is_primary: contactChannelIsPrimarySchema.optional(),
}).required();

export const contactChannelsCrudServerCreateSchema = contactChannelsCrudClientCreateSchema.concat(yupObject({
  is_verified: contactChannelIsVerifiedSchema.optional(),
}));

export const contactChannelsCrudClientDeleteSchema = yupMixed();

export const contactChannelsCrud = createCrud({
  clientReadSchema: contactChannelsClientReadSchema,
  clientUpdateSchema: contactChannelsCrudClientUpdateSchema,
  clientCreateSchema: contactChannelsCrudClientCreateSchema,
  clientDeleteSchema: contactChannelsCrudClientDeleteSchema,
  serverUpdateSchema: contactChannelsCrudServerUpdateSchema,
  serverCreateSchema: contactChannelsCrudServerCreateSchema,
  docs: {
    clientRead: {
      summary: "Get a contact channel",
      description: "",
      tags: ["Contact Channels"],
    },
    clientCreate: {
      summary: "Create a contact channel",
      description: "",
      tags: ["Contact Channels"],
    },
    clientUpdate: {
      summary: "Update a contact channel",
      description: "",
      tags: ["Contact Channels"],
    },
    clientDelete: {
      summary: "Delete a contact channel",
      description: "",
      tags: ["Contact Channels"],
    },
    clientList: {
      summary: "List contact channels",
      description: "",
      tags: ["Contact Channels"],
    }
  }
});
export type ContactChannelsCrud = CrudTypeOf<typeof contactChannelsCrud>;
