import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "./ui/switch";
import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import React, { useEffect, useId, useRef, useState } from "react";
import { Label } from "./ui/label";
import { DelayedInput, Input } from "./ui/input";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { Accordion } from "@radix-ui/react-accordion";
import { AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";


export function SettingCard(props: {
  title: string,
  description?: string,
  actions?: React.ReactNode,
  children?: React.ReactNode,
  accordion?: string,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        {props.description && <CardDescription>{props.description}</CardDescription>}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {props.accordion ? 
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>{props.accordion}</AccordionTrigger>
              <AccordionContent>
                {props.children}
              </AccordionContent>
            </AccordionItem>
          </Accordion> :
          props.children}

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
  disabled?: boolean,
  onCheckedChange: (checked: boolean) => void | Promise<void>,
  actions?: React.ReactNode,
  onlyShowActionsWhenChecked?: boolean,
}) {
  const id = useId();
  const [checkedState, setCheckedState] = useState(props.checked);
  const checked = props.checked ?? checkedState;
  const showActions = !props.onlyShowActionsWhenChecked || checked;

  const onCheckedChange = async (checked: boolean) => {
    setCheckedState(checked);
    await props.onCheckedChange(checked);
  };

  return (
    <div className="flex items-center">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={props.disabled}
      />
      <Label className='px-2' htmlFor={id}>{props.label}</Label>
      {showActions && props.actions}
    </div>
  );
}

export const SettingIconButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>((props, ref) => {
  return (
    <Button variant='ghost' size='sm' className="p-1 h-full" onClick={props.onClick} ref={ref}>
      <Settings className="w-4 h-4 text-muted-foreground" />
    </Button>
  );
});
SettingIconButton.displayName = "SettingIconButton";

export function SettingInput(props: {
  label: string,
  defaultValue?: string,
  onChange: (value: string) => void | Promise<void>,
  actions?: React.ReactNode,
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{props.label}</Label>
      <DelayedInput
        className="max-w-[400px]"
        defaultValue={props.defaultValue}
        onChange={(e) => runAsynchronously(props.onChange(e.target.value))}
      />
      {props.actions}
    </div>
  );
}
