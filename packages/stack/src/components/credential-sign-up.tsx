'use client';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { PasswordInput } from "./password-input";
import FormWarningText from "./form-warning";
import { useStackApp } from "..";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const schema = yup.object().shape({
  email: yup.string().email('Please enter a valid email').required('Please enter your email'),
  password: yup.string().required('Please enter your password').test({
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
  passwordRepeat: yup.string().nullable().oneOf([yup.ref('password'), null], 'Passwords do not match').required('Please repeat your password')
});

export default function CredentialSignUp() {
  const { register, handleSubmit, setError, formState: { errors }, clearErrors } = useForm({
    resolver: yupResolver(schema)
  });
  const app = useStackApp();

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    const { email, password } = data;
    const error = await app.signUpWithCredential({ email, password });
    setError('email', { type: 'manual', message: error?.message });
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
        onChange={(e) => {
          clearErrors('password');
          clearErrors('passwordRepeat');
        }}
      />
      <FormWarningText text={errors.password?.message?.toString()} />
        
      <Label htmlFor="repeat-password" className="mt-4 mb-1">Repeat Password</Label>
      <PasswordInput
        id="repeat-password"
        {...register('passwordRepeat')}
        onChange={(e) => {
          clearErrors('password');
          clearErrors('passwordRepeat');
        }}
      />
      <FormWarningText text={errors.passwordRepeat?.message?.toString()} />
      
      <Button type="submit" className="mt-6">
        Sign Up
      </Button>
    </form>
  );
}
