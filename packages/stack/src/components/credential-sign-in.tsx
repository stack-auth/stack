'use client';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormWarningText from "./form-warning";
import PasswordField from "./password-field";
import { useStackApp } from "..";
import { Button, Input, Label, Link } from "../components-core";
import { KnownErrors } from "@stackframe/stack-shared";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";

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

    if (error instanceof KnownErrors.EmailPasswordMismatch) {
      setError('password', { type: 'manual', message: 'Wrong email or password' });
    } else if (error) {
      setError('email', { type: 'manual', message: `An error occurred. ${error.message}` });
    }
  };

  return (
    <form 
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }} 
      onSubmit={e => runAsynchronously(handleSubmit(onSubmit)(e))}
      noValidate
    >
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        {...register('email')}
        onChange={(e) => clearErrors('email')}
      />
      <FormWarningText text={errors.email?.message?.toString()} />

      <Label htmlFor="password" style={{ marginTop: '1rem' }}>Password</Label>
      <PasswordField
        id="password"
        {...register('password')}
        onChange={(e) => clearErrors('password')}
      />
      <FormWarningText text={errors.password?.message?.toString()} />

      <Link href={app.urls.forgotPassword} size='sm' style={{ marginTop: '0.5rem' }}>
        Forgot password?
      </Link>

      <Button
        type="submit"
        style={{ marginTop: '1.5rem' }}
      >
        Sign In
      </Button>
    </form>
  );
}
