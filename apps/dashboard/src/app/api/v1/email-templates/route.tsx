import { listEmailTemplatesWithDefault } from "@/lib/email-templates";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { CrudTypeOf, createCrud } from "@stackframe/stack-shared/dist/crud";
import { emailTemplateServerReadSchema, emailTemplateTypes } from "@stackframe/stack-shared/dist/interface/crud/email-templates";
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


const crudHandlers = createCrudHandlers(listEmailTemplatesCrud, {
  paramNames: [],
  async onRead({ auth }) {
    return await listEmailTemplatesWithDefault(auth.project.id);
  },
});


export const GET = crudHandlers.readHandler;
