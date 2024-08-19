"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";

export function ColorModeSwitcher() {
  const { setTheme } = useTheme();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("dark")}
        className="dark:hidden"
      >
        <Moon />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("light")}
        className="hidden dark:flex"
      >
        <Sun />
      </Button>
    </>
  );
}
