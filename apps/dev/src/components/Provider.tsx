'use client';

import React, { useState } from "react";
import { elements } from "@stackframe/stack-ui-joy";
import { StackUIProvider } from "@stackframe/stack-ui";
import { ThemeProvider } from "next-themes";

type UI = 'default' | 'joy';
const CurrentUIContext = React.createContext<[UI, React.Dispatch<React.SetStateAction<UI>>]>(['default', () => {}]);

export function useCurrentUI() {
  return React.useContext(CurrentUIContext);
}

export default function Provider({ children }) {
  const [context, setContext] = useState<UI>("default");

  return (
    <CurrentUIContext.Provider value={[context, setContext]}>
      <ThemeProvider>
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