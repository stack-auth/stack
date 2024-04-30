// import type { Metadata } from "next";
// import { Inter } from "next/font/google";
// import "./globals.css";
const { Inter } = require("next/font/google");
require("./globals.css");
const x = require('@stackframe/stack');
// import { StackAdminApp } from "@stackframe/stack";

console.log(x, '!!!!!!!!!!!!!!!!');

const inter = Inter({ subsets: ["latin"] });

function RootLayout({
  children,
}: any) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

module.exports = RootLayout;
