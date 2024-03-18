import { deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { redirect } from "next/navigation";

export const GET = deprecatedSmartRouteHandler(async () => {
  redirect("/dashboard/auth/users");
});
