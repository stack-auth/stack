"use client";

import { useLayoutEffect } from "react";

export function SsrScript(props: { script: string; nonce?: string }) {
  useLayoutEffect(() => {
    // TODO fix workaround: React has a bug where it doesn't run the script on the first CSR render if SSR has been skipped due to suspense
    // As a workaround, we run the script in the <script> tag again after the first render
    // Note that we do an indirect eval as described here: https://esbuild.github.io/content-types/#direct-eval
    (0, eval)(props.script);
  }, []);

  return <script suppressHydrationWarning nonce={props.nonce} dangerouslySetInnerHTML={{ __html: props.script }} />;
}
