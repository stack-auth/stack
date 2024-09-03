import { teamsCrudHandlers } from "../crud";

export const GET = teamsCrudHandlers.readHandler;
export const PATCH = teamsCrudHandlers.updateHandler;
export const DELETE = teamsCrudHandlers.deleteHandler;
