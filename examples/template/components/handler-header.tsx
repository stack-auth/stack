'use client';

import Link from "next/link";
import { UserButton, useUser } from "@stackframe/stack";
import { useTheme } from "next-themes";
import { Logo } from "./logo";

export default function HandlerHeader() {
  const user = useUser();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <div className="fixed w-full z-50 p-4 h-12 flex items-center py-4 border-b justify-between bg-white dark:bg-black">
        <Logo link={user ? "/dashboard" : "/"}/>

        <div className="flex items-center justify-end gap-5">
          <UserButton colorModeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        </div>
      </div>
      <div className="min-h-12"/> {/* Placeholder for fixed header */}
    </>
  );
}