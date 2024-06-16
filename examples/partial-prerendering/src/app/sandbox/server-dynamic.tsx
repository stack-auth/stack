import { headers } from "next/headers";
import React from "react";

export async function ServerDynamic(props: React.PropsWithChildren<{ ms?: number }>) {
  void headers();

  await new Promise((resolve) => setTimeout(resolve, props.ms ?? 3_000));

  return (
    <span>
      {props.children ?? "ServerDynamic"}
    </span>
  );
}
