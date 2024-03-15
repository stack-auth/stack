'use client';

import React from 'react';
import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";
import StyledComponentsRegistry from './registry';

type DesignContextValue = {
  colors: {
    primaryColor: string,
    secondaryColor: string,
    primaryBgColor: string,
    secondaryBgColor: string,
    neutralColor: string,
  },
  breakpoints: {
    xs: number,
    sm: number,
    md: number,
    lg: number,
    xl: number,
  },
  currentTheme: 'dark' | 'light',
  setTheme: (theme: 'dark' | 'light') => void,
}
const DesignContext = createContext<DesignContextValue | undefined>(undefined);

function getColors(theme: 'dark' | 'light') {
  return {
    primaryColor: '#570df8',
    secondaryColor: '#bababa',
    primaryBgColor: theme === 'dark' ? 'black' : 'white',
    secondaryBgColor: theme === 'dark' ? '#1f1f1f' : '#f5f5f5',
    neutralColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
  };
}

export function StackUIProvider(props: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentTheme = theme === 'dark' ? 'dark' : 'light';
  const [designValue, setDesignValue] = useState<DesignContextValue>({
    colors: getColors(currentTheme),
    breakpoints: {
      xs: 400,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
    currentTheme,
    setTheme,
  });

  useEffect(() => {
    setDesignValue((v) => ({
      ...v,
      colors: getColors(currentTheme),
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