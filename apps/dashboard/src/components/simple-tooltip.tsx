import { CircleAlert, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export function SimpleTooltip(props: {
  tooltip: React.ReactNode,
  children?: React.ReactNode,
  type?: 'info' | 'warning',
}) {
  const icon = props.type === 'warning' ? 
    <CircleAlert className="w-4 h-4 text-zinc-500" /> : 
    props.type === 'info' ? 
      <Info className="w-4 h-4 text-zinc-500" /> : 
      null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {props.children} {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-60 text-center text-wrap">
            {props.tooltip}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
