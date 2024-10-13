import { teamMembershipsCrudHandlers } from "../../crud";

// TODO: move this to /team-memberships
export const POST = teamMembershipsCrudHandlers.createHandler;
export const DELETE = teamMembershipsCrudHandlers.deleteHandler;
