"use client";

import { SheetProps, Sheet } from "@mui/joy";
import React from "react";
import { useAdminApp } from "./useAdminInterface";
import { SidebarContents } from "./sidebar-contents";

export function Sidebar(props: SheetProps & {
  onCloseSidebar?: () => void,
  headerHeight: number,
}) {
  const stackAdminApp = useAdminApp();
  const { onCloseSidebar = () => {}, ...sheetProps } = props;

  return (
    <Sheet
      {...sheetProps}
    >
      <SidebarContents headerHeight={props.headerHeight} />
    </Sheet>
  );
}
