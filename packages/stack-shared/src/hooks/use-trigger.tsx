import * as React from "react";

export function useTrigger(callback: () => void) {
  const [hasTriggered, setHasTriggered] = React.useState(false);
  React.useEffect(() => {
    if (hasTriggered) {
      callback();
    }
  }, [hasTriggered]);
  return () => setHasTriggered(true);
}
