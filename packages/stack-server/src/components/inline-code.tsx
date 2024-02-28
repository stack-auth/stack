"use client";

import { Typography, TypographyProps } from "@mui/joy";
import { MouseEvent } from "react";
import { hasClickableParent } from "stack-shared/dist/utils/dom";
import { getNodeText } from "@/utils/react";
import { useSnackbar } from "@/hooks/use-snackbar";
import { runAsynchronously } from "stack-shared/src/utils/promises";

export function InlineCode(props: TypographyProps<"code">) {
  const { onClick, style, ...typographyProps } = props;

  const snackbar = useSnackbar();

  return (
    <Typography
      component="code"
      display="inline"
      data-n2-clickable={true}
      {...typographyProps}
      style={{
        cursor: "pointer",
        ...style,
      }}
      onClick={(e: MouseEvent<HTMLElement>) => {
        onClick?.(e);
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
    />
  );
}
