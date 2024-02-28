import { Alert, AlertProps, Box, Stack } from "@mui/joy";
import { MaterialSymbolName } from "./icon/material-symbol-names";
import { Icon } from "./icon";

export function IconAlert(props: AlertProps & {
  icon?: React.ReactNode,
}) {
  const { icon, ...rest } = props;
  const defaultIconName: MaterialSymbolName = ({
    neutral: "info",
    primary: "info",
    success: "check_circle",
    warning: "warning",
    danger: "error",
  } as const)[rest.color ?? "neutral"];
  const newIcon = icon ?? <Icon icon={defaultIconName} />;

  return (
    <Alert {...rest}>
      <Stack direction="row" alignItems="flex-start" spacing={2}>
        <Stack>
          {newIcon}
        </Stack>
        <Box>
          {props.children}
        </Box>
      </Stack>
    </Alert>
  );
}
