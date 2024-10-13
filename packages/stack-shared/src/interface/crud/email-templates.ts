import { CrudTypeOf, createCrud } from "../../crud";
import { jsonSchema, yupBoolean, yupMixed, yupObject, yupString } from "../../schema-fields";

export type EmailTemplateType = typeof emailTemplateTypes[number];
export const emailTemplateTypes = ['email_verification', 'password_reset', 'magic_link', 'team_invitation'] as const;

export const emailTemplateAdminReadSchema = yupObject({
  type: yupString().oneOf(emailTemplateTypes).required(),
  subject: yupString().required(),
  content: jsonSchema.required(),
  is_default: yupBoolean().required(),
}).required();

export const emailTemplateCrudAdminUpdateSchema = yupObject({
  content: jsonSchema.nonNullable().optional(),
  subject: yupString().optional(),
}).required();

export const emailTemplateCrudAdminDeleteSchema = yupMixed();

export const emailTemplateCrudAdminCreateSchema = yupObject({
  type: yupString().oneOf(emailTemplateTypes).required(),
  content: jsonSchema.required(),
  subject: yupString().required(),
}).required();

export const emailTemplateCrud = createCrud({
  adminReadSchema: emailTemplateAdminReadSchema,
  adminUpdateSchema: emailTemplateCrudAdminUpdateSchema,
  adminCreateSchema: emailTemplateCrudAdminCreateSchema,
  adminDeleteSchema: emailTemplateCrudAdminDeleteSchema,
  docs: {
    adminRead: {
      hidden: true,
    },
    adminCreate: {
      hidden: true,
    },
    adminUpdate: {
      hidden: true,
    },
    adminDelete: {
      hidden: true,
    },
    adminList: {
      hidden: true,
    }
  }
});
export type EmailTemplateCrud = CrudTypeOf<typeof emailTemplateCrud>;
