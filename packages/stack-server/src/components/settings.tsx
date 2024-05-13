import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "./ui/switch";
import Typography from "./ui/typography";
import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";


export function SettingCard(props: {
  title: string,
  description?: string,
  actions?: React.ReactNode,
  children?: React.ReactNode,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        {props.description && <CardDescription>{props.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {props.children}
      </CardContent>
      {props.actions && <CardFooter>
        <div className="w-full flex justify-end">
          {props.actions}
        </div>
      </CardFooter>}
    </Card>
  );
}

export function SettingSwitch(props: {
  label: string | React.ReactNode,
  checked: boolean,
  onCheckedChange: (checked: boolean) => void | Promise<void>,
  actions?: React.ReactNode,
  onlyShowActionsWhenChecked?: boolean,
}) {
  const [checkedState, setCheckedState] = useState(props.checked);
  const checked = props.checked ?? checkedState;
  const showActions = !props.onlyShowActionsWhenChecked || checked;

  const onCheckedChange = async (checked: boolean) => {
    setCheckedState(checked);
    await props.onCheckedChange(checked);
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Typography>{props.label}</Typography>
      {showActions && props.actions}
    </div>
  );
}

export function SettingIconButton(props: {
  onClick?: () => void | Promise<void>,
}) {
  return (
    <Button variant='ghost' size='sm' className="p-1 h-full" onClick={props.onClick}>
      <Settings className="w-4 h-4 text-muted-foreground" />
    </Button>
  );
}