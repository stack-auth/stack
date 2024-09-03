"use client";

import { ThemeProvider } from "next-themes";
import React from "react";

export default function Provider({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
