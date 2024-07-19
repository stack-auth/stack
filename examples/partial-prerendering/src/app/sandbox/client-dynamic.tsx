"use client";

import React from "react";

const waiterPromises = new Map();

export function ClientDynamic(props: React.PropsWithChildren<{ val: string }>) {
  if (typeof window === "undefined") {
    throw Object.assign(
      new Error("Disabling SSR"),
      {
        // https://github.com/vercel/next.js/blob/d01d6d9c35a8c2725b3d74c1402ab76d4779a6cf/packages/next/src/shared/lib/lazy-dynamic/bailout-to-csr.ts#L14
        digest: "BAILOUT_TO_CLIENT_SIDE_RENDERING",
        reason: "ClientDynamic",
      }
    );
  }

  let waiterPromise = waiterPromises.get(props.val);
  if (!waiterPromise) {
    waiterPromise = new Promise((resolve) => setTimeout(resolve, 10_000));
    waiterPromises.set(props.val, waiterPromise);
    console.log("ClientDynamic: waiting for", props.val);
  }

  React.use(waiterPromise);
  return (
    <span>
      {props.children ?? "ClientDynamic"}
    </span>
  );
}
