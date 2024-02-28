import { StackProvider } from "stack";
import { stackServerApp } from "src/stack";
import Provider from "src/components/Provider";
import ColorMode from "src/components/ColorMode";
import './global.css';
import Link from "next/link";


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
            <div className="sticky top-0 z-50 p-4 h-12 flex justify-between items-center py-4 border-b border-base-300">
              <Link href="/" className="font-bold">
                Stack Demo
              </Link>
              <ColorMode />
            </div>
            {children}
          </Provider>
        </StackProvider>
      </body>
    </html>
  );
}
