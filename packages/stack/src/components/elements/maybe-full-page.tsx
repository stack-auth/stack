"use client";

import { Container } from "@stackframe/stack-ui";
import React, { useId } from "react";
import { SsrScript } from "./ssr-layout-effect";

export function MaybeFullPage({
  children,
  fullPage=true
}: {
  children: React.ReactNode,
  fullPage?: boolean,
}) {
  const uniqueId = useId();
  const id = `stack-card-frame-${uniqueId}`;

  const scriptString = `(([id]) => {
    const el = document.getElementById(id);
    if (!el) {
      // component is not full page
      return;
    }
    const offset = el.getBoundingClientRect().top + document.documentElement.scrollTop;
    el.style.minHeight = \`calc(100vh - \${offset}px)\`;
  })(${JSON.stringify([id])})`;

  if (fullPage) {
    return (
      <>
        <div
          id={id}
          suppressHydrationWarning
          style={{
            minHeight: '100vh',
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="stack-scope"
        >
          <Container size={380} style={{ padding: '1rem 1rem' }}>
            {children}
          </Container>
        </div>
        <SsrScript script={scriptString} />
      </>
    );
  } else {
    return <>
      {children}
    </>;
  }

}
