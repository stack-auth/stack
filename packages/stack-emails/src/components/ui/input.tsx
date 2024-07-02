import * as React from "react";

import { cn } from "../../utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };


export interface DelayedInputProps extends InputProps {
  delay?: number,
}

export const DelayedInput = React.forwardRef<HTMLInputElement, DelayedInputProps>(
  ({ delay = 500, defaultValue, ...props }, ref) => {
    const [value, setValue] = React.useState(defaultValue ?? "");

    const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = setTimeout(() => {
        props.onChange?.(e);
      }, delay);
    };

    return <Input ref={ref} {...props} value={value} onChange={onChange} />;
  }
);
DelayedInput.displayName = "DelayedInput";
