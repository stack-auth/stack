import type { Metadata } from 'next';
import React from 'react';
import '../polyfills';

export const metadata: Metadata = {
  title: 'Stack Auth API',
  description: 'API endpoint of Stack Auth.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
