"use client";

import React from "react";
import { hasClickableParent } from "@stackframe/stack-shared/dist/utils/dom";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { getNodeText } from "@stackframe/stack-shared/dist/utils/react";
import { cn } from "../../lib/utils";
import { useToast } from "./use-toast";

const InlineCode = React.forwardRef<React.ElementRef<"code">, React.ComponentPropsWithoutRef<"code">>((props, ref) => {
  const { toast } = useToast();

  return (
    <code
      ref={ref}
      {...props}
      className={cn("cursor-pointer rounded-sm bg-zinc-200 px-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300", props.className)}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        props.onClick?.(e);
        if (!hasClickableParent(e.currentTarget)) {
          e.stopPropagation();
          e.preventDefault();
          runAsynchronously(async () => {
            try {
              await navigator.clipboard.writeText(getNodeText(props.children));
              toast({ description: "Copied to clipboard!" });
            } catch {
              toast({ description: "Failed to copy to clipboard", variant: "destructive" });
            }
          });
        }
      }}
    />
  );
});
InlineCode.displayName = "Code";

export { InlineCode };
