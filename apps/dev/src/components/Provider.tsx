'use client';

import React, { useState } from "react";
import { StackProvider } from "@stackframe/stack";
import { elements } from "@stackframe/stack-ui-joy";
import { StackUIProvider } from "@stackframe/stack-ui";
import { ThemeProvider } from "next-themes";
import { stackServerApp } from "src/stack";

type UI = 'default' | 'joy';
const CurrentUIContext = React.createContext<[UI, React.Dispatch<React.SetStateAction<UI>>]>(['default', (v: any) => {}]);

export function useCurrentUI() {
  return React.useContext(CurrentUIContext);
}

export default function Provider({ children }) {
  const [context, setContext] = useState<UI>("default");

  return (
    <CurrentUIContext.Provider value={[context, setContext]}>
      <ThemeProvider attribute="class">
        <StackUIProvider
          theme={{
            elements: {
              'default': undefined,
              'joy': elements,
            }[context]
          }}
        >
          {children}
        </StackUIProvider>
      </ThemeProvider>
    </CurrentUIContext.Provider>
  );
}