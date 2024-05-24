import { createEmailTemplate, getEmailTemplate, listEmailTemplates } from "@/lib/email-templates";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { createEmailTemplateCrud, listEmailTemplatesCrud } from "@stackframe/stack-shared/dist/interface/crud/email-templates";


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
    throw new Error("Not implemented");
  },
  async onCreate({ auth, data }) {
    const oldTemplate = await getEmailTemplate(auth.project.id, data.type);
    if (oldTemplate) {
      throw new KnownErrors.EmailTemplateAlreadyExists();
    }
    return await createEmailTemplate(auth.project.id, data);
  },
});