'use client';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FormWarningText } from "./elements/form-warning";
import { useStackApp } from "..";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Button, Input, Label, PasswordInput, StyledLink } from "@stackframe/stack-ui";
import { useState } from "react";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

const schema = yupObject({
  email: yupString().email('Please enter a valid email').required('Please enter your email'),
  password: yupString().required('Please enter your password')
});

export function CredentialSignIn() {
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });
  const app = useStackApp();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);

    try {
      const { email, password } = data;
      const error = await app.signInWithCredential({
        email,
        password,
      });
      setError('email', { type: 'manual', message: error?.message });
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
      />
      <FormWarningText text={errors.email?.message?.toString()} />

      <Label htmlFor="password" className="mt-4 mb-1">Password</Label>
      <PasswordInput
        id="password"
        {...register('password')}
      />
      <FormWarningText text={errors.password?.message?.toString()} />

      <StyledLink href={app.urls.forgotPassword} className="mt-1 text-sm">
        Forgot password?
      </StyledLink>

      <Button type="submit" className="mt-6" loading={loading}>
        Sign In
      </Button>
    </form>
  );
}
