import Link from "next/link";
import { Metadata } from "next";
import { StackProvider } from "@stackframe/stack";
import { stackServerApp } from "src/stack";
import Provider from "src/components/provider";
import Header from "src/components/header";
import './global.css';

export const metadata: Metadata = {
  title: 'Stack Demo',
  description: 'Example of using Stack as your authentication system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <StackProvider
          app={stackServerApp}
        >
          <Provider>
            <div className="flex flex-col h-screen">
              <Header />
              <div className="flex-grow">
                {children}
              </div>
            </div>
          </Provider>
        </StackProvider>
      </body>
    </html>
  );
}
