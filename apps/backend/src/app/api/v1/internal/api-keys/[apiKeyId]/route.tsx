import { apiKeyCrudHandlers } from "../crud";

export const GET = apiKeyCrudHandlers.readHandler;
export const PATCH = apiKeyCrudHandlers.updateHandler;
export const DELETE = apiKeyCrudHandlers.deleteHandler;