import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/shadcn";

export const typographyVariants = cva("text-md", {
  variants: {
    type: {
      h1: "text-3xl font-semibold",
      h2: "text-2xl font-medium",
      h3: "text-xl font-medium",
      p: "text-md",
      label: "text-sm",
      footnote: "text-xs",
    },
    variant: {
      primary: "text-black dark:text-white",
      secondary: "text-zinc-600 dark:text-zinc-400",
      destructive: "text-destructive",
      success: "text-green-500",
    },
  },
  defaultVariants: {
    type: "p",
    variant: "primary",
  },
});

export interface TypographyProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof typographyVariants> {}

const Typography = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, type, variant, ...props }, ref) => {
    const Comp = (type === 'footnote' || type === 'label' ? 'p' : type) || 'p';
    return (
      <Comp
        className={cn(typographyVariants({ type, variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Typography.displayName = "Typography";

export default Typography;