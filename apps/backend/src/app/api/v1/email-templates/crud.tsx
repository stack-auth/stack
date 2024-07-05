import { createPrismaCrudHandlers } from "@/route-handlers/prisma-handler";
import { validateEmailTemplateContent } from "@stackframe/stack-emails/dist/utils";
import { KnownErrors } from "@stackframe/stack-shared";
import { emailTemplateCrud, emailTemplateTypes } from "@stackframe/stack-shared/dist/interface/crud/email-templates";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";

export const emailTemplateCrudHandlers = createPrismaCrudHandlers(emailTemplateCrud, "emailTemplate", {
  paramsSchema: yupObject({
    type: yupString().oneOf(emailTemplateTypes).required(),
  }),
  onPrepare: async ({ auth }) => {
    if (!auth.user) {
      throw new KnownErrors.UserAuthenticationRequired();
    }
    if (auth.user.project_id !== 'internal') {
      throw new KnownErrors.ExpectedInternalProject();
    }
  },
  baseFields: async ({ auth, params }) => ({
    projectConfigId: auth.project.evaluatedConfig.id,
    type: params.type,
  }),
  whereUnique: async ({ auth, params }) => ({
    projectConfigId_type: {
      projectConfigId: auth.project.evaluatedConfig.id,
      type: params.type,
    },
  }),
  include: async () => ({}),
  notFoundError: () => new KnownErrors.ProjectNotFound(),
  crudToPrisma: async (crud, { type }) => {
    if (!validateEmailTemplateContent(crud.content)) {
      throw new StatusError(StatusError.BadRequest, 'Invalid email template content format');
    }

    return {
      content: crud.content as any,
      subject: crud.subject,
      type: type === 'create' ? crud.type : undefined,
    };
  },
  prismaToCrud: async (prisma) => {
    return {
      subject: prisma.subject,
      content: prisma.content as any,
      type: prisma.type,
    };
  },
});
