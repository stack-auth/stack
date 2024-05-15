'use client';

import { UserButton } from "@stackframe/stack";
import { Logo } from "./logo";
import Link from "next/link";
import { useColorScheme } from "@mui/joy";
import Typography from "./ui/typography";

export function Navbar({ ...props }) {
  const { mode, setMode } = useColorScheme();
  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between border-b bg-white dark:bg-black px-4 ${props.className || ""}`}
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
        <UserButton colorModeToggle={() => setMode(mode === 'light' ? 'dark' : 'light')}/>
      </div>
    </header>
  );
}
