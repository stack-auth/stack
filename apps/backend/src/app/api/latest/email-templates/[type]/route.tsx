import { emailTemplateCrudHandlers } from "../crud";

export const GET = emailTemplateCrudHandlers.readHandler;
export const PATCH = emailTemplateCrudHandlers.updateHandler;
export const DELETE = emailTemplateCrudHandlers.deleteHandler;
