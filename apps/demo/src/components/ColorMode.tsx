'use client';
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ColorMode() {
  const [mounted, setMounted] = useState(false);
  const { theme, setColorMode } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  return (
    <button onClick={() => setColorMode(theme === 'light' ? 'dark' : 'light')} className='btn btn-ghost'>
      {theme === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
}
