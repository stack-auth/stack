import { CircleAlert } from "lucide-react";
import { SimpleTooltip } from "./simple-tooltip";

export function AlertBadge(props: {
  children: React.ReactNode,
}) {
  return (
    <SimpleTooltip tooltip={props.children}>
      <CircleAlert className="text-zinc-500 h-4 w-4 inline" />
    </SimpleTooltip>
  );
}
