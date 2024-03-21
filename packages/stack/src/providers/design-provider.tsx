'use client';

import React from 'react';
import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_COLORS } from '../utils/constants';

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
  colorMode: 'dark' | 'light',
  setColorMode: (theme: 'dark' | 'light') => void,
}

export type DesignConfig = {
  colors?: {
    dark: Partial<ColorPalette>,
    light: Partial<ColorPalette>,
  },
  breakpoints?: Partial<Breakpoints>,
} & (
  {} 
  | {
    colorMode: 'dark' | 'light',
    setColorMode: (theme: 'dark' | 'light') => void,
  }
)

const DesignContext = createContext<DesignContextValue | undefined>(undefined);

const defaultBreakpoints: Breakpoints = {
  xs: 400,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

export function hasCustomColorMode(config: DesignConfig): config is DesignConfig & { 
  colorMode: 'dark' | 'light', 
  setColorMode: (theme: 'dark' | 'light') => void,
} {
  return 'colorMode' in config && 'setColorMode' in config;
}

function getColors(
  theme: 'dark' | 'light', 
  colors: { dark: Partial<ColorPalette>, light: Partial<ColorPalette> } | undefined,
): ColorPalette {
  return { ...DEFAULT_COLORS[theme], ...colors?.[theme]};
}

const useColorMode = (
  props: DesignConfig, 
): ['dark' | 'light', (theme: 'dark' | 'light') => void] => {
  const { resolvedTheme: nextColorMode, setTheme: setNextColorMode } = useTheme();
  const nextColorModeValue = nextColorMode === 'dark' ? 'dark' : 'light';
  if (hasCustomColorMode(props)) {
    return [
      props.colorMode,
      props.setColorMode,
    ];
  } else {
    return [
      nextColorModeValue,
      setNextColorMode,
    ];
  }
};


export function StackDesignProvider(props: { children?: React.ReactNode } & DesignConfig) {
  const [mounted, setMounted] = useState(false);
  const [colorMode, setColorMode] = useColorMode(props);
  const [designValue, setDesignValue] = useState<DesignContextValue>({
    colors: getColors(colorMode, props.colors),
    breakpoints: { ...defaultBreakpoints, ...props.breakpoints },
    colorMode,
    setColorMode,
  });

  useEffect(() => {
    setDesignValue((v) => ({
      ...v,
      colors: getColors(colorMode, props.colors),
      colorMode,
    }));
  }, [colorMode]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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