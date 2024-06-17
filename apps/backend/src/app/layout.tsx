import '../polyfills';
import React from 'react';
import type { Metadata } from 'next';

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
