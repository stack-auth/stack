"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import React, { useEffect, useId, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import * as yup from "yup";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { ActionDialog, ActionDialogProps, Form } from "@stackframe/stack-ui";
import { SmartForm } from "./smart-form";

export function SmartFormDialog<S extends yup.ObjectSchema<any, any, any, any>>(
  props: Omit<ActionDialogProps, "children"> & {
    formSchema: S;
    onSubmit: (values: yup.InferType<S>) => Promise<void | "prevent-close"> | void | "prevent-close";
  },
) {
  const formId = `${useId()}-form`;
  const [submitting, setSubmitting] = useState(false);
  const [openState, setOpenState] = useState(false);
  const handleSubmit = async (values: yup.InferType<S>) => {
    const res = await props.onSubmit(values);
    if (res !== "prevent-close") {
      setOpenState(false);
      props.onOpenChange?.(false);
      props.onClose?.();
    }
  };

  return (
    <ActionDialog
      {...props}
      open={props.open ?? openState}
      onOpenChange={(open) => {
        setOpenState(open);
        props.onOpenChange?.(open);
      }}
      okButton={{
        onClick: async () => "prevent-close",
        ...(typeof props.okButton === "boolean" ? {} : props.okButton),
        props: {
          form: formId,
          type: "submit",
          loading: submitting,
          ...(typeof props.okButton === "boolean" ? {} : props.okButton?.props),
        },
      }}
    >
      <SmartForm formSchema={props.formSchema} onSubmit={handleSubmit} onChangeIsSubmitting={setSubmitting} formId={formId} />
    </ActionDialog>
  );
}

export function FormDialog<F extends FieldValues>(
  props: Omit<ActionDialogProps, "children"> & {
    defaultValues?: Partial<F>;
    onSubmit: (values: F) => Promise<void | "prevent-close"> | void | "prevent-close";
    render: (form: ReturnType<typeof useForm<F>>) => React.ReactNode;
    formSchema: yup.ObjectSchema<F>;
  },
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
      if (result !== "prevent-close") {
        setOpenState(false);
        props.onClose?.();
        props.onOpenChange?.(false);
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
      onOpenChange={(open) => {
        if (open) setOpenState(true);
        props.onOpenChange?.(open);
      }}
      onClose={() => {
        form.reset();
        setOpenState(false);
        runAsynchronouslyWithAlert(props.onClose?.());
      }}
      okButton={{
        onClick: async () => "prevent-close",
        ...(typeof props.okButton == "boolean" ? {} : props.okButton),
        props: {
          form: formId,
          type: "submit",
          loading: submitting,
          ...(typeof props.okButton == "boolean" ? {} : props.okButton?.props),
        },
      }}
    >
      <Form {...form}>
        <form onSubmit={(e) => runAsynchronouslyWithAlert(form.handleSubmit(onSubmit)(e))} className="space-y-4" id={formId}>
          {props.render(form)}
        </form>
      </Form>
    </ActionDialog>
  );
}
