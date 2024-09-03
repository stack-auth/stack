"use client";

import * as confetti from "canvas-confetti";
import { useEffect } from "react";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";

export function Confetti() {
  useEffect(() => {
    runAsynchronously(confetti.default() ?? throwErr("Confetti failed to load"));
  }, []);

  return <></>;
}
