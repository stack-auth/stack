console.log("AAAAAAAA ROUTE");

import { currentUserCrudHandlers } from "./crud";


console.log("BBBBBBBB ROUTE");

export const GET = currentUserCrudHandlers.readHandler;
export const PUT = currentUserCrudHandlers.updateHandler;
