import { currentUserCrudHandlers } from "../crud";

export const GET = currentUserCrudHandlers.readHandler;
export const PATCH = currentUserCrudHandlers.updateHandler;
export const DELETE = currentUserCrudHandlers.deleteHandler;
