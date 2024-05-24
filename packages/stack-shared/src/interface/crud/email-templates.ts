import { CrudTypeOf, createCrud } from "../../crud";
import * as yup from "yup";
import { emailTemplateTypes } from "../serverInterface";

export const emailTemplateServerReadSchema = yup.object({
  id: yup.string().required(),
  type: yup.string().oneOf(emailTemplateTypes).required(),
  content: yup.object().nullable().defined().transform((value) => JSON.parse(JSON.stringify(value))),
}).required();

export const emailTemplateCrudServerUpdateSchema = yup.object({
  id: yup.string().required(),
  content: yup.object().optional()
}).required();

const serverDeleteSchema = yup.mixed();

export const emailTemplateCrud = createCrud({
  serverReadSchema: emailTemplateServerReadSchema,
  serverUpdateSchema: emailTemplateCrudServerUpdateSchema,
  serverDeleteSchema,
});
export type EmailTemplateCrud = CrudTypeOf<typeof emailTemplateCrud>;

export const listEmailTemplatesReadSchema = yup.array().of(emailTemplateServerReadSchema).required();

export const emailTemplateCrudServerCreateSchema = yup.object({
  type: yup.string().oneOf(emailTemplateTypes).required(),
  content: yup.object().nullable().defined().transform((value) => JSON.parse(JSON.stringify(value))),
}).required();

export const listEmailTemplatesCrud = createCrud({
  serverReadSchema: listEmailTemplatesReadSchema,
});

export type ListEmailTemplatesCrud = CrudTypeOf<typeof listEmailTemplatesCrud>;

export const createEmailTemplateCrud = createCrud({
  serverReadSchema: emailTemplateServerReadSchema,
  serverCreateSchema: emailTemplateCrudServerCreateSchema,
});

export type CreateEmailTemplateCrud = CrudTypeOf<typeof createEmailTemplateCrud>;