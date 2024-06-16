console.log("AAAAAAAA ROUTE");

import { currentUserCrudHandlers } from "@/app/api/v1/current-user/crud";

console.log("BBBBBBBB ROUTE");

export const GET = currentUserCrudHandlers.readHandler;
export const PUT = currentUserCrudHandlers.updateHandler;
