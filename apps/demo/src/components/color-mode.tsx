'use client';
import { Button } from "@stackframe/stack";
import { useAdaptiveTheme } from "./provider";

export default function ColorMode() {
  const { theme, setTheme } = useAdaptiveTheme();

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
