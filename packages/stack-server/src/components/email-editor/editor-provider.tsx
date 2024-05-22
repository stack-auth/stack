'use client';

import { CssBaseline, ThemeProvider } from "@mui/material";
import THEME from "./theme";

export function EmailEditorProvider(props: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={THEME}>
      <CssBaseline />
      {props.children}
    </ThemeProvider>
  );
}