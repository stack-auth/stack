"use client";

import { Container } from "@stackframe/stack-ui";
import React, { useEffect, useId } from "react";

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

  useEffect(() => {
    // TODO fix workaround: React has a bug where it doesn't run the script on the first CSR render if SSR has been skipped due to suspense
    // As a workaround, we run the script in the <script> tag again after the first render
    // Note that we do an indirect eval as described here: https://esbuild.github.io/content-types/#direct-eval
    (0, eval)(scriptString);
  }, []);

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
        <script dangerouslySetInnerHTML={{
          __html: scriptString,
        }} />
      </>
    );
  } else {
    return <>
      {children}
    </>;
  }
  
}
