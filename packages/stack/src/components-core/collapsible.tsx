"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;
type CollapsibleProps = React.ComponentProps<typeof Collapsible>;
type CollapsibleTriggerProps = React.ComponentProps<typeof CollapsibleTrigger>;
type CollapsibleContentProps = React.ComponentProps<typeof CollapsibleContent>;

export { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps };
