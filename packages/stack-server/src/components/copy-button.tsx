"use client";;
import { useSnackbar } from "@/hooks/use-snackbar";
import { Button } from "./ui/button";
import { Copy } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

const CopyButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button> & {
    content: string,
  }
>((props, ref) => {
  const snackbar = useSnackbar();

  return (
    <Button
      variant="secondary"
      {...props}
      className={cn("h-6 w-6 p-1", props.className)}
      ref={ref}
      onClick={async (...args) => {
        await props.onClick?.(...args);
        try {
          await navigator.clipboard.writeText(props.content);
          snackbar.showSuccess('Copied to clipboard!');
        } catch (e) {
          snackbar.showError('Failed to copy to clipboard!');
        }
      }}
    >
      <Copy />
    </Button>
  );
});
CopyButton.displayName = "CopyButton";

export { CopyButton };