'use client';
import { StackDesignProvider, StackElementProvider } from '@stackframe/stack-ui';
import { elements } from "@stackframe/stack-ui-joy";
import { ThemeProvider } from 'next-themes';

export default function Provider({ children }) {
  return (
    <ThemeProvider>
      <StackDesignProvider>
        <StackElementProvider elements={elements}>
          {children}
        </StackElementProvider>
      </StackDesignProvider>
    </ThemeProvider>
  );
}