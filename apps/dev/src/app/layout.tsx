import React from "react";
import { StackProvider } from "@stackframe/stack";
import Provider from "src/components/provider";
import { stackServerApp } from "src/stack";
import './global.css';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <StackProvider app={stackServerApp}>
          <Provider>
            {children}
          </Provider>
        </StackProvider>
      </body>
    </html>
  );
}
