"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";

interface OriginalSwitchProps extends React.ComponentProps<typeof SwitchPrimitives.Root> {}

const OriginalSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  OriginalSwitchProps
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
OriginalSwitch.displayName = SwitchPrimitives.Root.displayName;
interface AsyncSwitchProps extends OriginalSwitchProps {
  onCheckedChange?: (checked: boolean) => Promise<void> | void,
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void,
  loading?: boolean,
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  AsyncSwitchProps
>(({ loading: loadingProp, onClick, ...props }, ref) => {
  const [isLoading, setLoading] = React.useState(false);
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      setLoading(true);
      try {
        await onClick(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCheckedChange = async (checked: boolean) => {
    if (props.onCheckedChange) {
      setLoading(true);
      try {
        await props.onCheckedChange(checked);
      } finally {
        setLoading(false);
      }
    }
  };

  const loading = loadingProp ?? isLoading;

  return (
    <OriginalSwitch
      onClick={(e) => runAsynchronously(handleClick(e))}
      onCheckedChange={(checked) => runAsynchronously(handleCheckedChange(checked))}
      disabled={loading}
      ref={ref}
      {...props}
    />
  );
});
Switch.displayName = "Switch";

export { Switch };
