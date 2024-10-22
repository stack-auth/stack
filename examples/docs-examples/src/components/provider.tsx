'use client';
import { StackTheme } from "@stackframe/stack";

export default function Provider({ children }) {
  return (
    <StackTheme>
      {children}
    </StackTheme>
  );
}
