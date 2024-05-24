import { deleteEmailTemplate, getEmailTemplate, updateEmailTemplate } from "@/lib/email-templates";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { emailTemplateCrud } from "@stackframe/stack-shared/dist/interface/crud/email-templates";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";


export const emailTemplateCrudHandlers = createCrudHandlers(emailTemplateCrud, {
  paramNames: ['templateId'],
  async onRead({ auth, params }) {
    const emailTemplate = await getEmailTemplate(auth.project.id, params.templateId);
    if (!emailTemplate) throw new StatusError(StatusError.NotFound);
    return emailTemplate;
  },
  async onUpdate({ auth, data }) {
    const emailTemplate = await updateEmailTemplate(auth.project.id, data.id, data);
    if (!emailTemplate) throw new StatusError(StatusError.NotFound);
    return emailTemplate;
  },
  async onDelete({ auth, params }) {
    await deleteEmailTemplate(auth.project.id, params.templateId);
  },
});
