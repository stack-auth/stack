'use client';

// eslint-disable-next-line
import { useRouter as useNextRouter } from 'next/navigation';
import React from 'react';

const routerContext = React.createContext<{ setNeedConfirm: (needConfirm: boolean) => void, needConfirm: boolean }>(
  { setNeedConfirm: () => {}, needConfirm: false }
);

export const confirmAlertMessage = "Are you sure you want to leave this page? Changes you made may not be saved.";

export function useRouter() {
  const router = useNextRouter();
  const context = React.useContext(routerContext);

  if (context.needConfirm) {
    return {
      push: (url: string) => { window.confirm(confirmAlertMessage) && router.push(url); },
      replace: (url: string) => { window.confirm(confirmAlertMessage) && router.replace(url); },
      back: () => { window.confirm(confirmAlertMessage) && router.back(); },
    };
  }

  return router;
}

export function useRouterConfirm() {
  return React.useContext(routerContext);
}

export function RouterProvider(props: {  children: React.ReactNode }) {
  const [needConfirm, setNeedConfirm] = React.useState(false);

  return <routerContext.Provider value={{ needConfirm, setNeedConfirm }}>
    {props.children}
  </routerContext.Provider>;
}