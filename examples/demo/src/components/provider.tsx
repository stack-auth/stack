'use client';

import React, { useState } from "react";
import { CssVarsProvider, getInitColorSchemeScript, useColorScheme } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { StackTheme } from "@stackframe/stack";
import { StackJoyTheme } from "@stackframe/stack/joy";
import { ThemeProvider, useTheme } from "next-themes";

type UI = 'default' | 'joy';
const CurrentUIContext = React.createContext<{
  ui: UI, 
  setUi: React.Dispatch<React.SetStateAction<UI>>,
}>({
  ui: 'default', 
  setUi: () => {},
});

const ThemeContext = React.createContext<{
  theme: 'dark' | 'light',
  setTheme: (theme: 'dark' | 'light') => void,
}>({
  theme: 'light',
  setTheme: () => {},
});

export function useCurrentUI() {
  return React.useContext(CurrentUIContext);
}

export function useAdaptiveTheme() {
  return React.useContext(ThemeContext);
}

function JoyThemeProvider({ children }) {
  const { mode, setMode } = useColorScheme();
  return (
    <ThemeContext.Provider value={{
      theme: mode === 'dark' ? 'dark' : 'light',
      setTheme: (theme) => setMode(theme),
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

function JoyProvider(props: any) {
  return (
    <CssVarsProvider defaultMode="system">
      <CssBaseline />
      <StackJoyTheme>
        <JoyThemeProvider>
          {props.children}
        </JoyThemeProvider>
      </StackJoyTheme>
    </CssVarsProvider>
  );
}

function DefaultThemeProvider({ children }) {
  const { theme, setTheme } = useTheme();
  return (
    <ThemeContext.Provider value={{           
      theme: theme === 'dark' ? 'dark' : 'light',
      setTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

function DefaultProvider(props: any) {
  return (
    <ThemeProvider>
      <StackTheme>
        <DefaultThemeProvider>
          {props.children}
        </DefaultThemeProvider>
      </StackTheme>
    </ThemeProvider>
  );
}

export default function Provider({ children }) {
  const [context, setContext] = useState<UI>("default");

  let UIProvider;
  switch (context) {
    case 'joy': {
      UIProvider = JoyProvider;
      break;
    }
    case 'default': {
      UIProvider = DefaultProvider;
      break;
    }
  }

  return (
    <>
      {context === 'joy' && getInitColorSchemeScript()}
      <UIProvider>
        <CurrentUIContext.Provider value={{ ui: context, setUi: setContext }}>
          {children}
        </CurrentUIContext.Provider>
      </UIProvider>
    </>
  );
}
