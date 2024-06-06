"use client";

import { useEffect } from "react";
import { useToast } from "./ui/use-toast";
import { isBrowserLike } from "@stackframe/stack-shared/dist/utils/env";

const neverNotify = [
  "Failed to fetch RSC payload",
  "[Fast Refresh] performing full",
];

const callbacks: ((prop: string, args: any[]) => void)[] = [];

if (process.env.NODE_ENV === 'development' && isBrowserLike()) {
  for (const prop of ["warn", "error"] as const) {
    const original = console[prop];
    console[prop] = (...args) => {
      original(...args, new Error("This error was caught by DevErrorNotifier, and the original stacktrace is below."));
      if (!neverNotify.some((msg) => args.some((arg) => `${arg}`.includes(msg)))) {
        callbacks.forEach((cb) => cb(prop, args));
      }
    };
  }
}

export function DevErrorNotifier() {
  const toast = useToast();

  useEffect(() => {
    callbacks.push((prop, args) => {
      toast.toast({
        title: `[DEV] console.${prop} called!`,
        description: `Please check the browser console. ${args.join(" ")}`,
      });
    });
    return () => {
      callbacks.pop();
    };
  }, [toast]);

  return null;
}
