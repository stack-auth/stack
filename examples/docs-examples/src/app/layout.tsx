import { StackProvider } from "@stackframe/stack";
import { Metadata } from "next";
import { Inter } from 'next/font/google';
import Provider from "src/components/provider";
import { stackServerApp } from "src/stack";
import './global.css';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <head />
      <body>
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
