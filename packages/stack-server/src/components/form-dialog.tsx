"use client";;
import * as yup from "yup";
import { useId, useState } from "react";
import { ActionDialog, ActionDialogProps } from "@/components/action-dialog";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { yupResolver } from "@hookform/resolvers/yup";
import { FieldValues, useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";


export function FormDialog<F extends FieldValues>(
  props: Omit<ActionDialogProps, 'children'> & { 
    defaultValues: Partial<F>, 
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
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values: F, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    setSubmitting(true);
    try {
      await props.onSubmit(values);
      form.reset(values);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ActionDialog
      {...props}
      open={open}
      onOpenChange={(open) => { if(open) setOpen(true); }}
      onClose={async () => { form.reset(); setOpen(false); await props.onClose?.(); }}
      okButton={{
        onClick: async () => "prevent-close",
        ...(typeof props.okButton == "boolean" ? {} : props.okButton),
        props: { form: formId, type: "submit", loading: submitting, ...((typeof props.okButton == "boolean") ? {} : props.okButton?.props) },
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