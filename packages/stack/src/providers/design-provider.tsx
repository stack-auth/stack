'use client';

import React from 'react';
import { createContext, useContext } from "react";
import { DEFAULT_COLORS } from '../utils/constants';
import { BrowserScript } from '../utils/browser-script';

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
  radius: string,
}

export type ColorPalette = {
  light: Colors,
  dark: Colors,
};

export type OptionalColorPalette = {
  light?: Partial<Colors>,
  dark?: Partial<Colors>,
};

type DesignContextValue = {
  colors: ColorPalette,
}

export type DesignConfig = {
  colors?: OptionalColorPalette,
}

const DesignContext = createContext<DesignContextValue | undefined>(undefined);

export function StackDesignProvider(props: { children?: React.ReactNode } & DesignConfig) {
  const designValue = {
    colors: { 
      dark: { ...DEFAULT_COLORS.dark, ...props.colors?.dark }, 
      light: { ...DEFAULT_COLORS.light, ...props.colors?.light } 
    },
  };

  return (
    <DesignContext.Provider value={designValue}>
      <BrowserScript colors={designValue.colors} />
      {props.children}
    </DesignContext.Provider> 
  );
}

export function useDesign(): DesignContextValue {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error("useDesign must be used within a StackTheme");
  }
  return context;
}
