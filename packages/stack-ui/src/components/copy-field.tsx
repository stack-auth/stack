import { Label, Textarea, Typography } from "..";
import { CopyButton } from "./copy-button";

export function CopyField(props: {
  value: string;
  label?: React.ReactNode;
  helper?: React.ReactNode;
  height?: number;
  monospace?: boolean;
}) {
  return (
    <div>
      {props.label && <Label>{props.label}</Label>}
      <div className="relative pr-2">
        <Textarea
          readOnly
          value={props.value}
          style={{
            height: props.height,
            fontFamily: props.monospace ? "ui-monospace, monospace" : "inherit",
            whiteSpace: props.monospace ? "pre" : "normal",
          }}
        />
        <CopyButton content={props.value} className="absolute right-4 top-2" />
      </div>
      {props.helper && (
        <Typography variant="secondary" type="label">
          {props.helper}
        </Typography>
      )}
    </div>
  );
}
