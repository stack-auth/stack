import { internalProjectsCrudHandlers } from "../crud";

export const GET = internalProjectsCrudHandlers.readHandler;
export const PATCH = internalProjectsCrudHandlers.updateHandler;
export const DELETE = internalProjectsCrudHandlers.deleteHandler;