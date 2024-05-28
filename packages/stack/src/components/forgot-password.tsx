'use client';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormWarningText from "./form-warning";
import { useStackApp } from "..";
import { Button, Input, Label } from "../components-core";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";

const schema = yup.object().shape({
  email: yup.string().email('Please enter a valid email').required('Please enter your email')
});

export default function ForgotPassword({ onSent }: { onSent?: () => void }) {
  const { register, handleSubmit, formState: { errors }, clearErrors } = useForm({
    resolver: yupResolver(schema)
  });
  const stackApp = useStackApp();

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    const { email } = data;
    await stackApp.sendForgotPasswordEmail(email);
    onSent?.();
  };

  return (
    <form
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}       
      onSubmit={e => runAsynchronously(handleSubmit(onSubmit)(e))}
      noValidate
    >
      <Label htmlFor="email">Your Email</Label>
      <Input
        id="email"
        type="email"
        {...register('email')}
        onChange={() => clearErrors('email')}
      />
      <FormWarningText text={errors.email?.message?.toString()} />

      <Button
        type="submit"
        style={{ marginTop: '1.5rem' }}
        onClick={handleSubmit(onSubmit)}
      >
        Send Email
      </Button>
    </form>
  );
}
