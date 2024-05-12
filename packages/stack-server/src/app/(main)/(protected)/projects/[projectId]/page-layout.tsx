import Typography from "@/components/ui/typography";

export function PageLayout(props: { 
  children: React.ReactNode, 
  title: string,
  description?: string,
  actions?: React.ReactNode,
}) {
  return (
    <div className="px-4 py-2">
      <div className="flex justify-between items-end">
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
      <div className="mt-4">
        {props.children}
      </div>
    </div>
  );
}