"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { hasClickableParent } from "@stackframe/stack-shared/dist/utils/dom";
import { getNodeText } from "@stackframe/stack-shared/dist/utils/react";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { useToast } from "./use-toast";

const InlineCode = React.forwardRef<
  React.ElementRef<"code">,
  React.ComponentPropsWithoutRef<"code">
>((props, ref) => {
  const { toast }  = useToast();

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
            toast({ description: 'Copied to clipboard!' });
          } catch (e) {
            toast({ description: 'Failed to copy to clipboard', variant: 'destructive' });
          }
        });
      }
    }}
  />;
});
InlineCode.displayName = "Code";

export { InlineCode };