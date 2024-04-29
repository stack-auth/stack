"use client";

import React from "react";

export function ClientStatic(props: React.PropsWithChildren<{}>) {
  return (
    <span>
      {props.children ?? "ClientStatic"}
    </span>
  );
}
