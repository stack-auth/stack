import { ReloadIcon } from "@radix-ui/react-icons";
import React from "react";

export const Spinner = React.forwardRef<
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
