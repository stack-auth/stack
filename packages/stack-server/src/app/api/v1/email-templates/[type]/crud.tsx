import { createEmailTemplate, deleteEmailTemplate, getEmailTemplate, updateEmailTemplate } from "@/lib/email-templates";
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
    const oldEmailTemplate = await getEmailTemplate(auth.project.id, type);
    if (oldEmailTemplate) {
      return await updateEmailTemplate(auth.project.id, type, data);
    } else {
      return await createEmailTemplate(auth.project.id, { type, content: data.content });
    }
  },
  async onDelete({ auth, params }) {
    const type = await typeSchema.validate(params.type);
    const emailTemplate = await getEmailTemplate(auth.project.id, type);
    if (!emailTemplate) {
      throw new StatusError(StatusError.NotFound, 'Email template not found');
    }
    await deleteEmailTemplate(auth.project.id, type);
  },
});
