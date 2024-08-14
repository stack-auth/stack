'use client';

import { ThemeProvider } from "next-themes";


export function Provider(props: { children?: React.ReactNode }) {
  return (
    <ThemeProvider>
      {props.children}
    </ThemeProvider>
  );
}