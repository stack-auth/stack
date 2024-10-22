'use client';

import Link from "next/link";
import { UserButton } from "@stackframe/stack";
import { useTheme } from "next-themes";

export default function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <div className="fixed w-full z-50 p-4 h-12 flex items-center py-4 border-b justify-between bg-white dark:bg-black">
        <Link href="/" className="font-semibold">
          Stack Demo
        </Link>

        <div className="flex items-center justify-end gap-5">
          <UserButton colorModeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        </div>
      </div>
      <div className="min-h-12"/> {/* Placeholder for fixed header */}
    </>
  );
}
