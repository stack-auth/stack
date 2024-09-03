import React from "react";
import { SimpleTooltip, Typography } from "@stackframe/stack-ui";

type SidebarPanelProps = {
  title: string;
  children: React.ReactNode;
  tooltip?: string;
};
export default function BaseSidebarPanel({ title, children, tooltip }: SidebarPanelProps) {
  return (
    <div className="px-4 py-2">
      <div className="mb-6 flex items-center gap-2">
        <Typography variant="secondary" className="font-medium">
          {title}
        </Typography>
        {tooltip && <SimpleTooltip tooltip={tooltip} type="info" />}
      </div>
      <div className="mb-3 flex flex-col gap-6">{children}</div>
    </div>
  );
}
