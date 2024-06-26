import { currentUserCrudHandlers } from "../crud";

export const GET = currentUserCrudHandlers.readHandler;
export const PUT = currentUserCrudHandlers.updateHandler;
export const DELETE = currentUserCrudHandlers.deleteHandler;
