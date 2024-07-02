import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";
import { emailTemplateTypes } from "../serverInterface";
import { yupJson } from "../../utils/yup";

export const emailTemplateServerReadSchema = yup.object({
  type: yup.string().oneOf(emailTemplateTypes).required(),
  subject: yup.string().required(),
  content: yupJson.required(),
}).required();

export const emailTemplateCrudServerUpdateSchema = yup.object({
  content: yupJson.required(),
  subject: yup.string().required(),
}).required();

const serverDeleteSchema = yup.mixed();

export const emailTemplateCrud = createCrud({
  serverReadSchema: emailTemplateServerReadSchema,
  serverUpdateSchema: emailTemplateCrudServerUpdateSchema,
  serverDeleteSchema,
});
export type EmailTemplateCrud = CrudTypeOf<typeof emailTemplateCrud>;

export const listEmailTemplatesReadSchema = yup.array().of(
  emailTemplateServerReadSchema.concat(yup.object({
    default: yup.boolean().required(),
  }))
).required();

export const emailTemplateCrudServerCreateSchema = yup.object({
  type: yup.string().oneOf(emailTemplateTypes).required(),
  content: yupJson.required(),
}).required();

export const listEmailTemplatesCrud = createCrud({
  serverReadSchema: listEmailTemplatesReadSchema,
});

export type ListEmailTemplatesCrud = CrudTypeOf<typeof listEmailTemplatesCrud>;
