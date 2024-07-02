import { usersCrudHandlers } from "../crud";

export const GET = usersCrudHandlers.readHandler;
export const PATCH = usersCrudHandlers.updateHandler;
export const DELETE = usersCrudHandlers.deleteHandler;
