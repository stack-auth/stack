import { createEmailTemplate, deleteEmailTemplate, getEmailTemplate, updateEmailTemplate } from "@/lib/email-templates";
import { validateEmailTemplateContent } from "@stackframe/stack-emails/dist/utils";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { emailTemplateCrud } from "@stackframe/stack-shared/dist/interface/crud/email-templates";
import { emailTemplateTypes } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import * as yup from "yup";

const typeSchema = yup.string().oneOf(emailTemplateTypes).required();

const crudHandlers = createCrudHandlers(emailTemplateCrud, {
  paramNames: ['type'],
  async onRead() {
    throw Error('Not implemented');
  },
  async onUpdate({ auth, data, params }) {
    if (!validateEmailTemplateContent(data.content)) {
      throw new StatusError(StatusError.BadRequest, 'Invalid email template content');
    }
    const type = await typeSchema.validate(params.type);
    const oldEmailTemplate = await getEmailTemplate(auth.project.id, type);
    if (oldEmailTemplate) {
      return await updateEmailTemplate(auth.project.id, type, data);
    } else {
      return await createEmailTemplate(auth.project.id, type, data);
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

export const PUT = crudHandlers.updateHandler;
export const DELETE = crudHandlers.deleteHandler;
