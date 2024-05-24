import { createEmailTemplate, deleteEmailTemplate, getEmailTemplate, listEmailTemplates, updateEmailTemplate } from "@/lib/email-templates";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { createEmailTemplateCrud, listEmailTemplatesCrud } from "@stackframe/stack-shared/dist/interface/crud/email-templates";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";


export const listEmailTemplatesCrudHandlers = createCrudHandlers(listEmailTemplatesCrud, {
  paramNames: [],
  async onRead({ auth }) {
    return await listEmailTemplates(auth.project.id);
  },
});

export const createEmailTemplateCrudHandlers = createCrudHandlers(createEmailTemplateCrud, {
  paramNames: [],
  async onRead() {
    // This should never be used
    throw new StatusError(StatusError.NotFound);
  },
  async onCreate({ auth, data }) {
    return await createEmailTemplate(auth.project.id, data);
  },
});