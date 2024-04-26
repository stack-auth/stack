"use client";

import * as confetti from "canvas-confetti";
import { useEffect } from "react";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";


export function Confetti() {
  useEffect(() => {
    runAsynchronously(confetti.default()?.catch((e) => console.error(e)));
  }, []);

  return (<></>);
}
