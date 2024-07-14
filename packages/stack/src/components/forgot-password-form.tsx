'use client';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FormWarningText } from "./elements/form-warning";
import { useStackApp } from "..";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Button, Input, Label } from "@stackframe/stack-ui";
import { useState } from "react";
import { yupObject, yupString, yupNumber, yupBoolean, yupArray, yupMixed } from "@stackframe/stack-shared/dist/schema-fields";

const schema = yupObject({
  email: yupString().email('Please enter a valid email').required('Please enter your email')
});

export function ForgotPasswordForm({ onSent }: { onSent?: () => void }) {
  const { register, handleSubmit, formState: { errors }, clearErrors } = useForm({
    resolver: yupResolver(schema)
  });
  const stackApp = useStackApp();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);
    try {
      const { email } = data;
      await stackApp.sendForgotPasswordEmail(email);
    onSent?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="flex flex-col items-stretch stack-scope"
      onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
      noValidate
    >
      <Label htmlFor="email" className="mb-1">Your Email</Label>
      <Input
        id="email"
        type="email"
        {...register('email')}
        onChange={() => clearErrors('email')}
      />
      <FormWarningText text={errors.email?.message?.toString()} />

      <Button type="submit" className="mt-6" loading={loading}>
        Send Email
      </Button>
    </form>
  );
}
