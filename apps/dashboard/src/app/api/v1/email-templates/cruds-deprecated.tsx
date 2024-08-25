import { CrudTypeOf, createCrud } from "@stackframe/stack-shared/dist/crud";
import { emailTemplateServerReadSchema, emailTemplateTypes } from "@stackframe/stack-shared/dist/interface/crud-deprecated/email-templates";
import { jsonSchema } from "@stackframe/stack-shared/dist/schema-fields";
import * as yup from "yup";

export const listEmailTemplatesReadSchema = yup.array().of(
  emailTemplateServerReadSchema.concat(yup.object({
    default: yup.boolean().required(),
  }))
).required();

export const emailTemplateCrudServerCreateSchema = yup.object({
  type: yup.string().oneOf(emailTemplateTypes).required(),
  content: jsonSchema.required(),
}).required();

export const listEmailTemplatesCrud = createCrud({
  serverReadSchema: listEmailTemplatesReadSchema,
});

export type ListEmailTemplatesCrud = CrudTypeOf<typeof listEmailTemplatesCrud>;
