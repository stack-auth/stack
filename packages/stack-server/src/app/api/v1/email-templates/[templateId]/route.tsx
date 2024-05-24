import { emailTemplateCrudHandlers } from "./crud";

export const GET = emailTemplateCrudHandlers.readHandler;
export const PUT = emailTemplateCrudHandlers.updateHandler;
export const DELETE = emailTemplateCrudHandlers.deleteHandler;
