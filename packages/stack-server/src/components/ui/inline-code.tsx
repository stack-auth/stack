"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { hasClickableParent } from "@stackframe/stack-shared/dist/utils/dom";
import { getNodeText } from "@stackframe/stack-shared/dist/utils/react";
import { useSnackbar } from "@/hooks/use-snackbar";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";

const InlineCode = React.forwardRef<
  React.ElementRef<"code">,
  React.ComponentPropsWithoutRef<"code">
>((props, ref) => {
  const snackbar = useSnackbar();

  return <code 
    ref={ref} 
    {...props} 
    className={cn("bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-sm px-1 cursor-pointer", props.className)}
    onClick={(e: React.MouseEvent<HTMLElement>) => {
      props.onClick?.(e);
      if (!hasClickableParent(e.currentTarget)) {
        e.stopPropagation();
        e.preventDefault();
        runAsynchronously(async () => {
          try {
            await navigator.clipboard.writeText(getNodeText(props.children));
            snackbar.showSuccess('Copied to clipboard!');
          } catch (e) {
            snackbar.showError('Failed to copy to clipboard!');
          }
        });
      }
    }}
  />;
});
InlineCode.displayName = "Code";

export { InlineCode };