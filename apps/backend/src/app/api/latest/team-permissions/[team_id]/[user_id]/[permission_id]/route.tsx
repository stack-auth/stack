import { teamPermissionsCrudHandlers } from "../../../crud";

// TODO: move this to /team-permissions
export const POST = teamPermissionsCrudHandlers.createHandler;
export const DELETE = teamPermissionsCrudHandlers.deleteHandler;
