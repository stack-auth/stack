'use client';

import { UserButton } from "@stackframe/stack";
import { Logo } from "./logo";
import Link from "next/link";
import Typography from "./ui/typography";
import { useTheme } from "next-themes";

export function Navbar({ ...props }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between border-b bg-white dark:bg-black px-4 shrink-0 ${props.className || ""}`}
      style={{ height: `50px` }}
    >
      <div className="flex items-center justify-center">
        <Logo full height={24} href="/projects" className="h-6" />
      </div>
      <div className="flex items-center">
        <div className="flex gap-4 mr-8 items-center">
          <Link href="mailto:team@stack-auth.com">
            <Typography type='label'>Feedback</Typography>
          </Link>
          <Link href="https://docs.stack-auth.com/">
            <Typography type='label'>Docs</Typography>
          </Link>
        </div>
        <UserButton colorModeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}/>
      </div>
    </header>
  );
}
