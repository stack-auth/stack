"use client";

import { Snackbar, SnackbarProps } from "@mui/joy";
import { createContext, use, useCallback, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";

export type SnackbarOptions = Omit<SnackbarProps, "open">;

type SnackbarInfo = {
  key: number | string,
  options: SnackbarOptions,
  open: boolean,
};

type SnackbarContextValue = {
  show: (props: SnackbarOptions) => void,
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider(props: { children: React.ReactNode }) {
  const [snackbars, setSnackbars] = useState<SnackbarInfo[]>([]);

  const value = useMemo<SnackbarContextValue>(() => ({
    show: (options: SnackbarOptions) => {
      setSnackbars((snackbars) => [
        ...snackbars,
        { options: options, key: generateUuid(), open: true },
      ]);
    },
  }), []);

  const closeSnackbar = useCallback((key: number | string) => {
    setSnackbars((snackbars) => snackbars.map((s) => s.key === key ? { ...s, open: false } : s));
    setTimeout(() => {
      setSnackbars((snackbars) => snackbars.filter((s) => s.key !== key));
    }, 1000);
  }, []);

  return (
    <SnackbarContext.Provider value={value}>
      {props.children}
      {snackbars.map((info) => (
        <Snackbar
          autoHideDuration={5000}
          {...info.options}
          open={info.open}
          onClose={() => closeSnackbar(info.key)}
          key={info.key}
        />
      ))}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const snackbarContextValue = use(SnackbarContext);
  if (!snackbarContextValue) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }

  const snackbar = useMemo(() => ({
    show: snackbarContextValue.show,
    showSuccess: (children: React.ReactNode, props?: SnackbarOptions) => snackbarContextValue.show({
      color: 'success',
      variant: 'soft',
      startDecorator: <Icon fill weight={700} icon="check_circle" />,
      children,
      autoHideDuration: 5000,
      ...props,
    }),
    showError: (children: React.ReactNode, props?: SnackbarOptions) => snackbarContextValue.show({
      color: 'danger',
      variant: 'soft',
      startDecorator: <Icon fill weight={700} icon="error" />,
      children,
      autoHideDuration: 5000,
      ...props,
    }),
  }), [snackbarContextValue]);

  return snackbar;
}
