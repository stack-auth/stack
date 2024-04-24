"use client";

import * as confetti from "canvas-confetti";
import { useEffect } from "react";


export function Confetti() {
  useEffect(() => {
    confetti.default()?.catch((e) => console.error(e));
  }, []);

  return (<></>);
}
