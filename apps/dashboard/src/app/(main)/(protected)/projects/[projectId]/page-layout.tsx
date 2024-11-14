import { Typography, cn } from "@stackframe/stack-ui";

export function PageLayout(props: {
  children: React.ReactNode,
  title: string,
  description?: string,
  actions?: React.ReactNode,
  width?: "full" | "lg" | "md" | "sm",
}) {
  const widthClass = {
    full: "w-full",
    lg: "max-w-[1250px] w-[1250px]",
    md: "max-w-[800px] w-[800px]",
    sm: "max-w-[600px] w-[600px]",
  }[props.width ?? "lg"];

  return (
    <div className="py-4 px-4 md:px-6 flex justify-center">
      <div className={cn(widthClass, "min-w-0")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
          <div>
            <Typography type="h2">
              {props.title}
            </Typography>
            {props.description && (
              <Typography type="p" variant="secondary">
                {props.description}
              </Typography>
            )}
          </div>
          {props.actions}
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {props.children}
        </div>
      </div>
    </div>
  );
}
