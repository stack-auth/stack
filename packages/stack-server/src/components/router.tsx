'use client';

// eslint-disable-next-line
import { useRouter as useNextRouter } from 'next/navigation';
import React from 'react';

const routerContext = React.createContext<{ setDisabled: (disabled: boolean) => void, disabled: boolean }>(
  { setDisabled: () => {}, disabled: false }
);

export const confirmAlertMessage = "Are you sure you want to leave this page? Changes you made may not be saved.";

export function useRouter() {
  const router = useNextRouter();
  const context = React.useContext(routerContext);

  if (context.disabled) {
    return {
      push: (url: string) => { window.confirm(confirmAlertMessage) && router.push(url); },
      replace: (url: string) => { window.confirm(confirmAlertMessage) && router.replace(url); },
      back: () => { window.confirm(confirmAlertMessage) && router.back(); },
    };
  }

  return router;
}

export function useDisableRouter() {
  return React.useContext(routerContext);
}

export function RouterProvider(props: {  children: React.ReactNode }) {
  const [disabled, setDisabled] = React.useState(false);

  return <routerContext.Provider value={{ disabled, setDisabled }}>
    {props.children}
  </routerContext.Provider>;
}