'use client';
import { useEffect, useState } from "react";

export function IframePreventer({ children }: {
  children: React.ReactNode,
}) {
  const [isIframe, setIsIframe] = useState(false);
  useEffect(() => {
    console.log('does this rerender?');
    console.log(window.self, window.top);
    if (window.self !== window.top) {
      setIsIframe(true);
    }
  }, []);

  if (isIframe) {
    return <div>Stack auth components may not run in an iframe.</div>;
  }

  return children;
}
