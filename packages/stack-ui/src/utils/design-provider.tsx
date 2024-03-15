'use client';

import React from 'react';
import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";
import StyledComponentsRegistry from './registry';

type ColorPalette = {
  primaryColor: string,
  secondaryColor: string,
  primaryBgColor: string,
  secondaryBgColor: string,
  neutralColor: string,
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
  currentTheme: 'dark' | 'light',
  setTheme: (theme: 'dark' | 'light') => void,
}

export type DesignProviderProps = {
  colors?: {
    dark: Partial<ColorPalette>,
    light: Partial<ColorPalette>,
  },
  breakpoints?: Partial<Breakpoints>,
};

const DesignContext = createContext<DesignContextValue | undefined>(undefined);

const defaultBreakpoints: Breakpoints = {
  xs: 400,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

const defaultColors = ({
  dark: {
    primaryColor: '#570df8',
    secondaryColor: '#bababa',
    primaryBgColor: 'black',
    secondaryBgColor: '#1f1f1f',
    neutralColor: '#27272a',
  },
  light: {
    primaryColor: '#570df8',
    secondaryColor: '#bababa',
    primaryBgColor: 'white',
    secondaryBgColor: '#f5f5f5',
    neutralColor: '#e4e4e7',
  },
} as const);

function getColors(
  theme: 'dark' | 'light', 
  colors: { dark: Partial<ColorPalette>, light: Partial<ColorPalette> } | undefined,
): ColorPalette {
  return { ...defaultColors[theme], ...colors?.[theme]};
}

export function StackDesignProvider(props: { children: React.ReactNode } & DesignProviderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentTheme = theme === 'dark' ? 'dark' : 'light';
  const [designValue, setDesignValue] = useState<DesignContextValue>({
    colors: getColors(currentTheme, props.colors),
    breakpoints: { ...defaultBreakpoints, ...props.breakpoints },
    currentTheme,
    setTheme,
  });

  useEffect(() => {
    setDesignValue((v) => ({
      ...v,
      colors: getColors(currentTheme, props.colors),
      currentTheme: currentTheme === 'dark' ? 'dark' : 'light',
    }));
  }, [currentTheme]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <StyledComponentsRegistry>
      <DesignContext.Provider value={designValue}>
        {props.children}
      </DesignContext.Provider>
    </StyledComponentsRegistry>
  );
}

export function useDesign(): DesignContextValue {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error("useDesign must be used within a StackDesignProvider");
  }
  return context;
}