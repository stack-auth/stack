'use client';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormWarningText from "./form-warning";
import { PasswordInput } from "./password-input";
import { useStackApp } from "..";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Link } from "./ui/link";
import { Button } from "./ui/button";

const schema = yup.object().shape({
  email: yup.string().email('Please enter a valid email').required('Please enter your email'),
  password: yup.string().required('Please enter your password')
});

export default function CredentialSignIn() {
  const { register, handleSubmit, setError, formState: { errors }, clearErrors } = useForm({
    resolver: yupResolver(schema)
  });
  const app = useStackApp();

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    const { email, password } = data;

    const error = await app.signInWithCredential({ email, password });
    setError('email', { type: 'manual', message: error?.message });
  };

  return (
    <form 
      className="flex flex-col stack-scope"
      onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
      noValidate
    >
      <Label htmlFor="email" className="mb-2">Email</Label>
      <Input
        id="email"
        type="email"
        {...register('email')}
      />
      <FormWarningText text={errors.email?.message?.toString()} />

      <Label htmlFor="password" className="mt-4 mb-2">Password</Label>
      <PasswordInput
        id="password"
        {...register('password')}
      />
      <FormWarningText text={errors.password?.message?.toString()} />

      <Link href={app.urls.forgotPassword} className="mt-2 text-sm underline">
        Forgot password?
      </Link>

      <Button type="submit" className="mt-4">
        Sign In
      </Button>
    </form>
  );
}
