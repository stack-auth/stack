import { Metadata } from "next";
import React from "react";
import Header from "src/components/header";
import Provider from "src/components/provider";
import { stackServerApp } from "src/stack";
import { StackProvider, StackTheme } from "@stackframe/stack";
import "./global.css";

export const metadata: Metadata = {
  title: "Stack Demo",
  description: "Example of using Stack as your authentication system.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <Provider>
              <div className="flex h-screen flex-col">
                <Header />
                <div className="flex-grow">{children}</div>
              </div>
            </Provider>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
