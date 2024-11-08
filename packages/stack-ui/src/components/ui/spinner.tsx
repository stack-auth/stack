import { ReloadIcon } from "@radix-ui/react-icons";
import React from "react";
import { forwardRefIfNeeded } from "@stackframe/stack-shared/dist/utils/react";

export const Spinner = forwardRefIfNeeded<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'>
>((props, ref) => {
  return (
    <span ref={ref} {...props}>
      <ReloadIcon className="animate-spin" />
    </span>
  );
});
Spinner.displayName = "Spinner";
