import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Switch } from "./ui/switch";
import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import React, { useEffect, useId, useRef, useState } from "react";
import { Label } from "./ui/label";
import { DelayedInput, Input } from "./ui/input";
import { runAsynchronously, runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Accordion } from "@radix-ui/react-accordion";
import { AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { FieldValues, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Form } from "./ui/form";
import * as yup from "yup";
import { useToast } from "./ui/use-toast";


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
        <div className="w-full flex justify-end gap-2">
          {props.actions}
        </div>
      </CardFooter>}
    </Card>
  );
}

export function SettingSwitch(props: {
  label: string | React.ReactNode,
  checked?: boolean,
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
  onChange?: (value: string) => void | Promise<void>,
  actions?: React.ReactNode,
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{props.label}</Label>
      <DelayedInput
        className="max-w-lg"
        defaultValue={props.defaultValue}
        onChange={(e) => runAsynchronouslyWithAlert(props.onChange?.(e.target.value))}
      />
      {props.actions}
    </div>
  );
}

export function SettingText(props: {
  label: string,
  children: React.ReactNode,
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{props.label}</Label>
      <div>
        {props.children}
      </div>
    </div>
  );
}

export function FormSettingCard<F extends FieldValues>(
  props: Omit<React.ComponentProps<typeof SettingCard>, 'children' | 'actions'> & {
    defaultValues?: Partial<F>,
    onSubmit: (values: F) => Promise<void> | void,
    render: (form: ReturnType<typeof useForm<F>>) => React.ReactNode,
    formSchema: yup.ObjectSchema<F>,
  }
) {
  const formId = useId();
  const form = useForm({
    resolver: yupResolver(props.formSchema),
    defaultValues: props.defaultValues as any,
    mode: "onChange",
  });
  const [submitting, setSubmitting] = useState(false);
  const buttonsDisabled = submitting || !form.formState.isDirty;
  const { toast } = useToast();

  const onSubmit = async (values: F, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    setSubmitting(true);
    try {
      await props.onSubmit(values);
      form.reset();
      toast({ title: "Your changes have been saved" });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    form.reset(props.defaultValues);
  }, [props.defaultValues, form]);

  return (
    <SettingCard {...props} actions={
      <>
        <Button onClick={() => form.reset()} variant='secondary' disabled={buttonsDisabled}>Cancel</Button>
        <Button form={formId} type="submit" loading={submitting} disabled={buttonsDisabled}>Save</Button>
      </>
    }>
      <Form {...form}>
        <form onSubmit={e => runAsynchronouslyWithAlert(form.handleSubmit(onSubmit)(e))} className="space-y-4" id={formId}>
          {props.render(form)}
        </form>
      </Form>
    </SettingCard>
  );
}
