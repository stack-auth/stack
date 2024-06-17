import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { redirect } from "next/navigation";

export const GET = deprecatedSmartRouteHandler(async () => {
  redirect("/projects");
});
