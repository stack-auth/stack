'use client';

import React from 'react';
import { createContext, useContext } from "react";
import { DEFAULT_COLORS } from '../utils/constants';

type Colors = {
  primaryColor: string,
  secondaryColor: string,
  backgroundColor: string,
  neutralColor: string,
}

export type ColorPalette = {
  light: Colors,
  dark: Colors,
};

type Breakpoints = {
  xs: number,
  sm: number,
  md: number,
  lg: number,
  xl: number,
};

type DesignContextValue = {
  colors: ColorPalette,
  breakpoints: Breakpoints,
}

export type DesignConfig = {
  colors?: Partial<ColorPalette>,
  breakpoints?: Partial<Breakpoints>,
}

const DesignContext = createContext<DesignContextValue | undefined>(undefined);

const defaultBreakpoints: Breakpoints = {
  xs: 400,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

export function StackDesignProvider(props: { children?: React.ReactNode } & DesignConfig) {
  const designValue = {
    colors: { 
      dark: { ...DEFAULT_COLORS.dark, ...props.colors?.dark }, 
      light: { ...DEFAULT_COLORS.light, ...props.colors?.light } 
    },
    breakpoints: { ...defaultBreakpoints, ...props.breakpoints },
  };

  return (
    <DesignContext.Provider value={designValue}>
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
