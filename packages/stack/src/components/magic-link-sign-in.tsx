'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FormWarningText } from "./elements/form-warning";
import { useStackApp } from "..";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Button, Input, Label } from "@stackframe/stack-ui";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

const schema = yupObject({
  email: yupString().email('Please enter a valid email').required('Please enter your email')
});

export function MagicLinkSignIn() {
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });
  const [sent, setSent] = useState(false);
  const app = useStackApp();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);
    try {
      const { email } = data;
      const error = await app.sendMagicLinkEmail(email);
      if (error) {
        setError('email', { type: 'manual', message: error.message });
        return;
      }
    setSent(true);
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
      <Label htmlFor="email" className="mb-1">Email</Label>
      <Input
        id="email"
        type="email"
        {...register('email')}
        disabled={sent}
      />
      <FormWarningText text={errors.email?.message?.toString()} />

      <Button disabled={sent} type="submit" className="mt-6" loading={loading}>
        {sent ? 'Email sent!' : 'Send magic link'}
      </Button>
    </form>
  );
}
