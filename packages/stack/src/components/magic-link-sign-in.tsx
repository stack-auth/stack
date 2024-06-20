'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormWarningText from "./form-warning";
import { useStackApp } from "..";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

const schema = yup.object().shape({
  email: yup.string().email('Please enter a valid email').required('Please enter your email')
});

export default function MagicLinkSignIn() {
  const { register, handleSubmit, setError, formState: { errors }, clearErrors } = useForm({
    resolver: yupResolver(schema)
  });
  const [sent, setSent] = useState(false);
  const app = useStackApp();

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    const { email } = data;

    const error = await app.sendMagicLinkEmail(email);
    if (error) {
      setError('email', { type: 'manual', message: error.message });
      return;
    }
    setSent(true);
  };

  return (
    <form 
      className="flex flex-col items-stretch stack-scope"
      onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
      noValidate
    >
      <Label htmlFor="email" className="mb-2">Email</Label>
      <Input
        id="email"
        type="email"
        {...register('email')}
        disabled={sent}
      />
      <FormWarningText text={errors.email?.message?.toString()} />

      <Button disabled={sent} type="submit" className="mt-4">
        {sent ? 'Email sent!' : 'Send magic link'}
      </Button>
    </form>
  );
}
