import { CopyButton, Typography } from "@stackframe/stack-ui";
import { useMetadata } from "../documents/editor/editor-context";
import BaseSidebarPanel from "./configuration-panel/input-panels/helpers/base-sidebar-panel";

export default function VariablesPanel() {
  const metadata = useMetadata();

  return (
    <BaseSidebarPanel
      title="Variables"
      tooltip="Variables can be used like {{ var }} in the strings. Handlebars syntax is supported. Example values are shown in the preview."
    >
      {metadata.variables.map((variable) => (
        <div key={variable.name} className="border-b pb-2">
          <div className="mt-1 flex items-center justify-between">
            <Typography className="mb-2" type="label">{`{{ ${variable.name} }}`}</Typography>
            <CopyButton content={`{{ ${variable.name} }}`} />
          </div>
          <Typography type="label" variant="secondary">
            {variable.example}
          </Typography>
        </div>
      ))}
    </BaseSidebarPanel>
  );
}
