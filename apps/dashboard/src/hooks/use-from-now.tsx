import { useEffect, useState } from "react";
import { fromNowDetailed } from "@stackframe/stack-shared/dist/utils/dates";

export function useFromNow(date: Date): string {
  const [invalidationCounter, setInvalidationCounter] = useState(0);

  const detailed = fromNowDetailed(date);

  useEffect(() => {
    if (Number.isFinite(detailed.secondsUntilChange)) {
      const timeout = setTimeout(
        () => {
          setInvalidationCounter(invalidationCounter + 1);
        },
        Math.round(detailed.secondsUntilChange * 1000),
      );
      return () => clearTimeout(timeout);
    }
  }, [invalidationCounter, detailed.secondsUntilChange]);

  return detailed.result;
}
