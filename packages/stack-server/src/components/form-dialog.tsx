"use client";;
import * as yup from "yup";
import { useEffect, useId, useState } from "react";
import { ActionDialog, ActionDialogProps } from "@/components/action-dialog";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { yupResolver } from "@hookform/resolvers/yup";
import { FieldValues, useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";


export function FormDialog<F extends FieldValues>(
  props: Omit<ActionDialogProps, 'children'> & { 
    defaultValues?: Partial<F>,
    onSubmit: (values: F) => Promise<void | 'prevent-close'> | void | 'prevent-close',
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
  const [openState, setOpenState] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values: F, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    setSubmitting(true);
    try {
      const result = await props.onSubmit(values);
      form.reset();
      if (result !== 'prevent-close') {
        setOpenState(false);
        await props.onClose?.();
        await props.onOpenChange?.(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    form.reset(props.defaultValues);
  }, [props.defaultValues, form]);

  return (
    <ActionDialog
      {...props}
      open={props.open ?? openState}
      onOpenChange={(open) => { if(open) setOpenState(true); props.onOpenChange?.(open); }}
      onClose={async () => { form.reset(); setOpenState(false); await props.onClose?.(); }}
      okButton={{
        onClick: async () => "prevent-close",
        ...(typeof props.okButton == "boolean" ? {} : props.okButton),
        props: { 
          form: formId, 
          type: "submit", 
          loading: submitting, 
          ...((typeof props.okButton == "boolean") ? {} : props.okButton?.props) 
        },
      }}
    >
      <Form {...form}>
        <form onSubmit={e => runAsynchronously(form.handleSubmit(onSubmit)(e))} className="space-y-4" id={formId}>
          {props.render(form)}
        </form>
      </Form>
    </ActionDialog>
  );
}