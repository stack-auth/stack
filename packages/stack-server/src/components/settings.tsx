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
  label: string,
  checked: boolean,
  onCheckedChange: (checked: boolean) => void | Promise<void>,
}) {
  return (
    <div className="flex items-center gap-4">
      <Switch
        checked={props.checked}
        onCheckedChange={props.onCheckedChange}
      />
      <Typography>{props.label}</Typography>
    </div>
  );
}