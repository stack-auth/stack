"use client";

import { Button, ButtonProps } from "@mui/joy";
import React from "react";
import { runAsynchronously } from "@stackframe/stack-shared/src/utils/promises";

export function AsyncButton(props: Omit<ButtonProps, 'onClick'> & {
  onClick?: (...args: Parameters<ButtonProps['onClick'] & {}>) => Promise<void> | void | any,
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  
  return (
    <Button
      {...props}
      loading={isLoading || props.loading}
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
    />
  );
};
