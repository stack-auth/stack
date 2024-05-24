import { deleteEmailTemplate, updateEmailTemplate } from "@/lib/email-templates";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { emailTemplateCrud } from "@stackframe/stack-shared/dist/interface/crud/email-templates";
import { emailTemplateTypes } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import * as yup from "yup";

const typeSchema = yup.string().oneOf(emailTemplateTypes).required();

export const emailTemplateCrudHandlers = createCrudHandlers(emailTemplateCrud, {
  paramNames: ['type'],
  async onRead({ auth, params }) {
    // this should never be called
    throw Error('Not implemented');
  },
  async onUpdate({ auth, data, params }) {
    const type = await typeSchema.validate(params.type);
    const emailTemplate = await updateEmailTemplate(auth.project.id, type, data);
    if (!emailTemplate) throw new StatusError(StatusError.NotFound);
    return emailTemplate;
  },
  async onDelete({ auth, params }) {
    const type = await typeSchema.validate(params.type);
    await deleteEmailTemplate(auth.project.id, type);
  },
});
