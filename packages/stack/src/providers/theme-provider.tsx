'use client';

import React from "react";
import StyledComponentsRegistry from "./styled-components-registry";
import { globalCSS } from "../generated/global-css";
import { BrowserScript } from "../utils/browser-script";
import { DEFAULT_THEME } from "../utils/constants";

type Colors = {
  background: string,
  foreground: string,
  card: string,
  cardForeground: string,
  popover: string,
  popoverForeground: string,
  primary: string,
  primaryForeground: string,
  secondary: string,
  secondaryForeground: string,
  muted: string,
  mutedForeground: string,
  accent: string,
  accentForeground: string,
  destructive: string,
  destructiveForeground: string,
  border: string,
  input: string,
  ring: string,
}

export type Theme = {
  light: Colors,
  dark: Colors,
  radius: string,
};

type ThemeConfig = {
  light?: Partial<Colors>,
  dark?: Partial<Colors>,
} & Partial<Omit<Theme, 'light' | 'dark'>>;
  

export function StackTheme({
  theme,
  children,
} : {
  theme?: ThemeConfig,
  children?: React.ReactNode,
}) {
  const themeValue: Theme = { 
    ...DEFAULT_THEME,
    ...theme,
    dark: { ...DEFAULT_THEME.dark, ...theme?.dark }, 
    light: { ...DEFAULT_THEME.light, ...theme?.light },
  };

  return (
    <StyledComponentsRegistry>
      <BrowserScript theme={themeValue} />
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />
      {children}
    </StyledComponentsRegistry>
  );
}