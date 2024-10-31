import { CrudTypeOf, createCrud } from "../../crud";
import { userIdOrMeSchema, userIdSchema, yupBoolean, yupMixed, yupObject, yupString } from "../../schema-fields";

const contactChannelsTypes = ['email'] as const;
const type = yupString().oneOf(contactChannelsTypes);
const value = yupString().when('type', {
  is: 'email',
  then: (schema) => schema.email(),
});

export const contactChannelsClientReadSchema = yupObject({
  user_id: userIdSchema.required(),
  id: yupString().required(),
  value: value.required(),
  type: type.required(),
  used_for_auth: yupBoolean().required(),
  is_verified: yupBoolean().required(),
  is_primary: yupBoolean().required(),
}).required();

export const contactChannelsCrudClientUpdateSchema = yupObject({
  value: value.optional(),
  type: type.optional(),
  used_for_auth: yupBoolean().optional(),
  is_primary: yupBoolean().optional(),
}).required();

export const contactChannelsCrudServerUpdateSchema = contactChannelsCrudClientUpdateSchema.concat(yupObject({
  is_verified: yupBoolean().optional(),
}));

export const contactChannelsCrudClientCreateSchema = yupObject({
  user_id: userIdOrMeSchema.required(),
  value: value.required(),
  type: type.required(),
  used_for_auth: yupBoolean().required(),
  is_primary: yupBoolean().optional(),
}).required();

export const contactChannelsCrudServerCreateSchema = contactChannelsCrudClientCreateSchema.concat(yupObject({
  is_verified: yupBoolean().optional(),
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
