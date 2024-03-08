import type { Metadata } from 'next';
import {GeistSans} from 'geist/font/sans';
import {GeistMono} from "geist/font/mono";
import { SnackbarProvider } from '@/hooks/use-snackbar';
import { Analytics } from "@vercel/analytics/react";

import './globals.css';
import ThemeProvider from '@/theme';
import { StyleLink } from '@/components/style-link';
import { getEnvVariable } from '@stackframe/stack-shared/dist/utils/env';
import React from 'react';

export const metadata: Metadata = {
  title: {
    default: 'stack-server',
    template: '%s | stack-server',
  },
  description: 'Some frontend with auth built by N2D4',
};

type TagConfigJson = {
  tagName: string,
  attributes: { [key: string]: string },
  innerHTML: string,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  const headTags: TagConfigJson[] = JSON.parse(getEnvVariable('NEXT_PUBLIC_STACK_HEAD_TAGS'));

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <StyleLink href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded&display=block" />
        <StyleLink defer href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.css" integrity="sha384-OH8qNTHoMMVNVcKdKewlipV4SErXqccxxlg6HC9Cwjr5oZu2AdBej1TndeCirael" crossOrigin="anonymous" />

        {headTags.map((tag, index) => {
          const { tagName, attributes, innerHTML } = tag;
          return React.createElement(tagName, {
            key: index,
            dangerouslySetInnerHTML: { __html: innerHTML ?? "" },
            ...attributes,
          });
        })}
      </head>
      <body
        style={{
          /**
           * NOTE: The font family is configured in the Joy UI theme config, at src/theme.tsx.
           * 
           * The font here is used as a fallback, and is intentionally egregious to make it obvious
           * when you forgot to wrap your text in a <Typography /> or <Paragraph /> component.
           */
          fontFamily: '"Brush Script MT", "Zapfino", "Comic Sans MS", cursive',
        }}
      >
        <Analytics />
        <ThemeProvider>
          <SnackbarProvider>
            {children}
          </SnackbarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
