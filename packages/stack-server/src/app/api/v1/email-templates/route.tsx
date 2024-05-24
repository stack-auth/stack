import { createEmailTemplateCrudHandlers, listEmailTemplatesCrudHandlers } from "./crud";

export const GET = listEmailTemplatesCrudHandlers.readHandler;
export const POST = createEmailTemplateCrudHandlers.createHandler;
