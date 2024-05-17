import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export function TextTooltip(props: {
  text: string,
  children: React.ReactNode,
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {props.children}
        </TooltipTrigger>
        <TooltipContent>
          {props.text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}