"use client";

import { Logo } from "@/components/logo";
import { Link } from "@/components/link";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import Typography from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";

export default function NotFound() {
  const router = useRouter();
  const isHydrated = useIsHydrated();
  const customBasePath = process.env.__NEXT_ROUTER_BASEPATH;
  const isDevelopment = process.env.NODE_ENV === "development";
  const showBasePathDisclaimer = isDevelopment && isHydrated && customBasePath && !window.location.pathname.startsWith(customBasePath);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4">
      <main className="max-w-lg flex flex-col gap-4 items-center text-center">
        <Logo width={128} />

        <Typography type='h1'>
          Oh no! 404
        </Typography>

        <Typography>
          Page not found.
        </Typography>

        <Button onClick={() => runAsynchronously(router.push('/'))}>Go back home</Button>

        {showBasePathDisclaimer && (
          <Typography variant="secondary">
            Developer hint: This is probably because the base path was set to <Link href="/">{customBasePath}</Link> in next.config.js, but your current path is outside of that.<br />
          </Typography>
        )}
      </main>
    </div>
  );
}
