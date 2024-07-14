'use client';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FormWarningText } from "./elements/form-warning";
import { useStackApp } from "..";
import { runAsynchronously, runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { Button, Input, Label, PasswordInput } from "@stackframe/stack-ui";
import { useState } from "react";
import { yupObject, yupString, yupNumber, yupBoolean, yupArray, yupMixed } from "@stackframe/stack-shared/dist/schema-fields";

const schema = yupObject({
  email: yupString().email('Please enter a valid email').required('Please enter your email'),
  password: yupString().required('Please enter your password').test({
    name: 'is-valid-password',
    test: (value, ctx) => {
      const error = getPasswordError(value);
      if (error) {
        return ctx.createError({ message: error.message });
      } else {
        return true;
      }
    }
  }),
  passwordRepeat: yupString().nullable().oneOf([yup.ref('password'), "", null], 'Passwords do not match').required('Please repeat your password')
});

export function CredentialSignUpForm() {
  const { register, handleSubmit, setError, formState: { errors }, clearErrors } = useForm({
    resolver: yupResolver(schema)
  });
  const app = useStackApp();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);
    try {
      const { email, password } = data;
      const error = await app.signUpWithCredential({ email, password });
      setError('email', { type: 'manual', message: error?.message });
    } finally {
      setLoading(false);
    }
  };

  const registerPassword = register('password');
  const registerPasswordRepeat = register('passwordRepeat');

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
        {...(x => (console.log(x), x))(register('email'))}
      />
      <FormWarningText text={errors.email?.message?.toString()} />

      <Label htmlFor="password" className="mt-4 mb-1">Password</Label>
      <PasswordInput
        id="password"
        {...registerPassword}
        onChange={(e) => {
          clearErrors('password');
          clearErrors('passwordRepeat');
          runAsynchronously(registerPassword.onChange(e));
        }}
      />
      <FormWarningText text={errors.password?.message?.toString()} />
        
      <Label htmlFor="repeat-password" className="mt-4 mb-1">Repeat Password</Label>
      <PasswordInput
        id="repeat-password"
        {...registerPasswordRepeat}
        onChange={(e) => {
          clearErrors('password');
          clearErrors('passwordRepeat');
          runAsynchronously(registerPasswordRepeat.onChange(e));
        }}
      />
      <FormWarningText text={errors.passwordRepeat?.message?.toString()} />
      
      <Button type="submit" className="mt-6" loading={loading}>
        Sign Up
      </Button>
    </form>
  );
}
