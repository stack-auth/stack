"use client";

import { useTheme } from "next-themes";
import { UserButton } from "@stackframe/stack";
import { Typography } from "@stackframe/stack-ui";
import { Link } from "./link";
import { Logo } from "./logo";

export function Navbar({ ...props }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <header
      className={`sticky top-0 z-30 flex shrink-0 items-center justify-between border-b bg-white px-4 dark:bg-black ${props.className || ""}`}
      style={{ height: `50px` }}
    >
      <div className="flex items-center justify-center">
        <Logo full height={24} href="/projects" className="h-6" />
      </div>
      <div className="flex items-center">
        <div className="mr-8 flex items-center gap-4">
          <Link href="mailto:team@stack-auth.com">
            <Typography type="label">Feedback</Typography>
          </Link>
          <Link href="https://docs.stack-auth.com/">
            <Typography type="label">Docs</Typography>
          </Link>
        </div>
        <UserButton colorModeToggle={() => setTheme(resolvedTheme === "light" ? "dark" : "light")} />
      </div>
    </header>
  );
}
