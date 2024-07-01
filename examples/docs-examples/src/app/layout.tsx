import { Metadata } from "next";
import { StackProvider } from "@stackframe/stack";
import { stackServerApp } from "src/stack";
import Provider from "src/components/provider";
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
      <body suppressHydrationWarning>
        <StackProvider
          app={stackServerApp}
        >
          <Provider>
            {children}
          </Provider>
        </StackProvider>
      </body>
    </html>
  );
}
