'use client';
import { useEffect, useState } from "react";

export function IframePreventer({ children }: {
  children: React.ReactNode,
}) {
  const [isIframe, setIsIframe] = useState(false);
  useEffect(() => {
    if (window.self !== window.top) {
      setIsIframe(true);
    }
  }, []);

  if (isIframe) {
    return <div>Stack Auth components may not run in an {'<'}iframe{'>'}.</div>;
  }

  return children;
}
