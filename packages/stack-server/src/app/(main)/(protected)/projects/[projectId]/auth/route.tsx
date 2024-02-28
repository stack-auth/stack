import { smartRouteHandler } from "@/lib/route-handlers";
import { redirect } from "next/navigation";

export const GET = smartRouteHandler(async () => {
  redirect("/dashboard/auth/users");
});
