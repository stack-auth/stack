const { StackProvider, StackTheme } = require("@stackframe/stack");
const { stackServerApp } = require("../stack");
require("./globals.css");


function RootLayout({
  children,
}: any) {
  return (
    <html lang="en">
      <body><StackProvider app={stackServerApp}><StackTheme>{children}</StackTheme></StackProvider></body>
    </html>
  );
}

module.exports = RootLayout;
