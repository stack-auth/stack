"use client";

import { CircularProgress, IconButton, IconButtonProps } from "@mui/joy";
import React from "react";
import { runAsynchronously } from "@stackframe/stack-shared/src/utils/promises";

export function AsyncIconButton(props: Omit<IconButtonProps, 'onClick'> & {
  onClick?: (...args: Parameters<IconButtonProps['onClick'] & {}>) => Promise<void> | void | any,
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  
  return (
    <IconButton
      {...props}
      disabled={isLoading || props.disabled}
      onClick={(...args) => {
        runAsynchronously(async () => {
          setIsLoading(true);
          try {
            await props.onClick?.(...args);
          } finally {
            setIsLoading(false);
          }
        });
      }}
    >
      {isLoading ? <CircularProgress /> : props.children}
    </IconButton>
  );
};
