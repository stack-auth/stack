import React from "react";

export function ServerStatic(props: React.PropsWithChildren<{}>) {
  return (
    <span>
      {props.children ?? "ServerStatic"}
    </span>
  );
}
