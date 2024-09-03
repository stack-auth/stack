"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { UserButton } from "@stackframe/stack";

export default function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <div className="fixed z-50 flex h-12 w-full items-center justify-between border-b bg-white p-4 py-4 dark:bg-black">
        <Link href="/" className="font-semibold">
          Stack Demo
        </Link>

        <div className="flex items-center justify-end gap-5">
          <UserButton colorModeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} />
        </div>
      </div>
      <div className="min-h-12" /> {/* Placeholder for fixed header */}
    </>
  );
}
