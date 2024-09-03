import { CrudTypeOf, createCrud } from "../../crud";
import { jsonSchema, yupMixed, yupObject, yupString } from "../../schema-fields";

export type EmailTemplateType = (typeof emailTemplateTypes)[number];
export const emailTemplateTypes = ["EMAIL_VERIFICATION", "PASSWORD_RESET", "MAGIC_LINK", "TEAM_INVITATION"] as const;

export const emailTemplateServerReadSchema = yupObject({
  type: yupString().oneOf(emailTemplateTypes).required(),
  subject: yupString().required(),
  content: jsonSchema.required(),
}).required();

export const emailTemplateCrudServerUpdateSchema = yupObject({
  content: jsonSchema.required(),
  subject: yupString().required(),
}).required();

export const emailTemplateCrudServerDeleteSchema = yupMixed();

export const emailTemplateCrudServerCreateSchema = yupObject({
  type: yupString().oneOf(emailTemplateTypes).required(),
  content: jsonSchema.required(),
  subject: yupString().required(),
}).required();

export const emailTemplateCrud = createCrud({
  serverReadSchema: emailTemplateServerReadSchema,
  serverUpdateSchema: emailTemplateCrudServerUpdateSchema,
  serverCreateSchema: emailTemplateCrudServerCreateSchema,
  serverDeleteSchema: emailTemplateCrudServerDeleteSchema,
  docs: {
    serverRead: {
      hidden: true,
    },
    serverCreate: {
      hidden: true,
    },
    serverUpdate: {
      hidden: true,
    },
    serverDelete: {
      hidden: true,
    },
    serverList: {
      hidden: true,
    },
  },
});
export type EmailTemplateCrud = CrudTypeOf<typeof emailTemplateCrud>;
