import Typography from "@/components/ui/typography";

export function PageLayout(props: { 
  children: React.ReactNode, 
  title: string,
  description?: string,
  actions?: React.ReactNode,
}) {
  return (
    <>
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
    </>
  );
}