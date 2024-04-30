'use client';
import { Button, useDesign } from "@stackframe/stack";
import { useTheme } from "next-themes";

export default function ColorMode() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="secondary"
      size='sm' 
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      Toggle theme
    </Button>
  );
}
