"use client";

import { Container } from "../components-core";
import React, { useEffect, useId } from "react";

export default function MaybeFullPage({ 
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
          className="min-h-screen flex items-center justify-center self-stretch"
        >
          <Container size={380} className="p-4">
            {children}
          </Container>
        </div>
        <script dangerouslySetInnerHTML={{ __html: scriptString }} />
      </>
    );
  } else {
    return <>
      {children}
    </>;
  }
  
}
