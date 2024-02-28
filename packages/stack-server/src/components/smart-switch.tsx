"use client";

import { Box, CircularProgress, Stack, Switch, SwitchProps } from "@mui/joy";
import React from "react";
import { runAsynchronously } from "stack-shared/src/utils/promises";

type T = Parameters<SwitchProps['onChange'] & {}>;

export function SmartSwitch({
  children,
  loading,
  onChange,
  sx,
  ...restProps
}: Omit<SwitchProps, "onChange" | "children"> & {
  children?: React.ReactNode,
  loading?: boolean,
  onChange?: (...args: Parameters<SwitchProps['onChange'] & {}>) => Promise<void> | void | any,
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const isActuallyLoading  = loading || isLoading;

  return (
    <Stack direction="row" alignItems="flex-start" spacing={2}>
      <Stack position="relative">
        {isActuallyLoading && (
          <CircularProgress
            size="sm"
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
        <Switch
          disabled={loading || isLoading}
          {...restProps}
          sx={{
            visibility: isActuallyLoading ? "hidden" : "visible",
            ...sx,
          }}
          onChange={(...args) => {
            runAsynchronously(async () => {
              setIsLoading(true);
              try {
                // eslint-disable-next-line
                return await onChange?.(...args);
              } finally {
                setIsLoading(false);
              }
            });
          }}
        />
      </Stack>
      {children && <Box>{children}</Box>}
    </Stack>
  );
}
