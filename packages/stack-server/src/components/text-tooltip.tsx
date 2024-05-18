import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export function TextTooltip(props: {
  text: string,
  children?: React.ReactNode,
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {props.children || <Info className="w-4 h-4 text-zinc-500" />}
        </TooltipTrigger>
        <TooltipContent>
          {props.text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}