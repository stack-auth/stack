'use client';
import { StackUIProvider } from '@stackframe/stack-ui';
import { ThemeProvider } from 'next-themes';

export default function Provider({ children }) {
  return (
    <ThemeProvider>
      <StackUIProvider>
        {children}
      </StackUIProvider>
    </ThemeProvider>
  );
}