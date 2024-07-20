'use client';

import React from "react";
import { StackTheme } from "@stackframe/stack";
import { ThemeProvider } from "next-themes";

export default function Provider({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
