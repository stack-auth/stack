import { StackProvider } from "@stackframe/stack";
import { StackUIProvider } from "@stackframe/stack-ui";
import { stackServerApp } from "src/stack";
import Provider from "src/components/Provider";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <StackProvider app={stackServerApp}>
          <Provider>
            {children}
          </Provider>
        </StackProvider>
      </body>
    </html>
  );
}
