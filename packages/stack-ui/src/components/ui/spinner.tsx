import { ReloadIcon } from "@radix-ui/react-icons";
import { forwardRefIfNeeded } from "@stackframe/stack-shared/dist/utils/react";
import React from "react";

export const Spinner = forwardRefIfNeeded<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'> & {
    size?: number,
  }
>(({ size = 15, ...props }, ref) => {
  return (
    <span ref={ref} {...props}>
      <ReloadIcon className="animate-spin" width={size} height={size} />
    </span>
  );
});
Spinner.displayName = "Spinner";
