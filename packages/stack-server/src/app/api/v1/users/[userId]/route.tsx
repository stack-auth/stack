import { usersCrudHandlers } from "../crud";

export const GET = usersCrudHandlers.readHandler;
export const PUT = usersCrudHandlers.updateHandler;
export const DELETE = usersCrudHandlers.deleteHandler;
