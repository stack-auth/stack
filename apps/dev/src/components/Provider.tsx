'use client';
import { StackDesignProvider, StackElementProvider } from '@stackframe/stack-ui';
import { ThemeProvider } from 'next-themes';

export default function Provider({ children }) {
  return (
    <ThemeProvider>
      <StackDesignProvider>
        <StackElementProvider>
          {children}
        </StackElementProvider>
      </StackDesignProvider>
    </ThemeProvider>
  );
}