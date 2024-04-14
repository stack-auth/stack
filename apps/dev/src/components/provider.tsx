'use client';

import React, { useState } from "react";
import { CssVarsProvider, getInitColorSchemeScript } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { StackTheme } from "@stackframe/stack";
import { StackJoyTheme } from "@stackframe/stack/joy";
import { Button } from "./custom-button";

type UI = 'default' | 'joy';
const CurrentUIContext = React.createContext<[UI, React.Dispatch<React.SetStateAction<UI>>]>(['default', () => {}]);

export function useCurrentUI() {
  return React.useContext(CurrentUIContext);
}

function JoyProvider(props: any) {
  return (
    <CssVarsProvider defaultMode="system">
      <CssBaseline />
      <StackJoyTheme>
        {props.children}
      </StackJoyTheme>
    </CssVarsProvider>
  );
}

function DefaultProvider(props: any) {
  // theme={{ components: { Button }}}>
  return (
    <StackTheme> 
      {props.children}
    </StackTheme>
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
        <CurrentUIContext.Provider value={[context, setContext]}>
          {children}
        </CurrentUIContext.Provider>
      </UIProvider>
    </>
  );
}