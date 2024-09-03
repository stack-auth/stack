import { Typography } from "@stackframe/stack-ui";

export function PageLayout(props: { children: React.ReactNode; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Typography type="h2">{props.title}</Typography>
          {props.description && (
            <Typography type="p" variant="secondary">
              {props.description}
            </Typography>
          )}
        </div>
        {props.actions}
      </div>
      <div className="mt-4 flex flex-col gap-4">{props.children}</div>
    </div>
  );
}
