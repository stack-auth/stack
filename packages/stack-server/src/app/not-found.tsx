"use client";

import { useIsHydrated } from "@/hooks/use-is-hydrated";
import ErrorPage from "@/components/ui/error-page";

export default function NotFound() {
  const isHydrated = useIsHydrated();
  const customBasePath = process.env.__NEXT_ROUTER_BASEPATH;
  const isDevelopment = process.env.NODE_ENV === "development";
  const showBasePathDisclaimer = isDevelopment && isHydrated && customBasePath && !window.location.pathname.startsWith(customBasePath);

  return <ErrorPage
    title="Oh no! 404"
    description="Page not found."
    redirectUrl="/"
    secondaryDescription={showBasePathDisclaimer && `Developer hint: This is probably because the base path was set to ${customBasePath} in next.config.js, but your current path is outside of that.`}
    redirectText="Go to home"
  />;
}
