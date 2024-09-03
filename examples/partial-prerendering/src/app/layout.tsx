import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import EnableFetchDelay from "./enable-fetch-delay";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stack Auth Partial Prerendering Demo",
  description: "A demo of Stack's partial prerendering capabilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <EnableFetchDelay />
            {children}
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
