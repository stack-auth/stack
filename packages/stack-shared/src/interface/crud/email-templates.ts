import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";
import { emailTemplateTypes } from "../serverInterface";
import { jsonSchema, yupArray, yupBoolean, yupMixed, yupObject, yupString } from "../../schema-fields";

export const emailTemplateServerReadSchema = yupObject({
  type: yupString().oneOf(emailTemplateTypes).required(),
  subject: yupString().required(),
  content: jsonSchema.required(),
}).required();

export const emailTemplateCrudServerUpdateSchema = yupObject({
  content: jsonSchema.required(),
  subject: yupString().required(),
}).required();

const serverDeleteSchema = yupMixed();

export const emailTemplateCrud = createCrud({
  serverReadSchema: emailTemplateServerReadSchema,
  serverUpdateSchema: emailTemplateCrudServerUpdateSchema,
  serverDeleteSchema,
});
export type EmailTemplateCrud = CrudTypeOf<typeof emailTemplateCrud>;

export const listEmailTemplatesReadSchema = yupArray(
  emailTemplateServerReadSchema.concat(yupObject({
    default: yupBoolean().required(),
  }))
).required();

export const emailTemplateCrudServerCreateSchema = yupObject({
  type: yupString().oneOf(emailTemplateTypes).required(),
  content: jsonSchema.required(),
}).required();

export const listEmailTemplatesCrud = createCrud({
  serverReadSchema: listEmailTemplatesReadSchema,
});

export type ListEmailTemplatesCrud = CrudTypeOf<typeof listEmailTemplatesCrud>;
