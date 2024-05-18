import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export function SimpleTooltip(props: {
  tooltip: React.ReactNode,
  children: React.ReactNode,
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {props.children}
        </TooltipTrigger>
        <TooltipContent>
          {props.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
