'use client';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormWarningText from "./form-warning";
import PasswordField from "./password-field";
import { useStackApp } from "..";
import { Button, Input, Label, Link } from "../components-core";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { useEffect, useState } from "react";

const schema = yup.object().shape({
  email: yup.string().email('Please enter a valid email').required('Please enter your email'),
  password: yup.string().required('Please enter your password')
});

export default function CredentialSignIn() {
  const { register, handleSubmit, setError, formState: { errors }, clearErrors } = useForm({
    resolver: yupResolver(schema)
  });
  const app = useStackApp();
  const [curTheme, setCurrentTheme] = useState('light')
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const matcher = window.matchMedia('(prefers-color-scheme: dark)');
      setCurrentTheme(matcher.matches ? 'dark' : 'light');

      const handleChange = () => setCurrentTheme(matcher.matches ? 'dark' : 'light');
      matcher.addListener(handleChange);

      return () => {
        matcher.removeListener(handleChange);
      };
    }
  }, []);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    const { email, password } = data;

    const error = await app.signInWithCredential({ email, password });
    setError('email', { type: 'manual', message: error?.message });
  };

  return (
    <form
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
      noValidate
    >
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        {...register('email')}
        style={{
          backgroundColor: curTheme === 'dark' ? 'black' : 'white',
          color: curTheme === 'dark' ? 'white' : 'black',
          border: '1px solid gray',
          padding: '0.5rem',
          marginTop: '0.5rem'
        }}

      />
      <FormWarningText text={errors.email?.message?.toString()} />

      <Label htmlFor="password" style={{ marginTop: '1rem' }}>Password</Label>
      <PasswordField
        id="password"
        {...register('password')}
        style={{
          backgroundColor: curTheme === 'dark' ? 'black' : 'white',
          color: curTheme === 'dark' ? 'white' : 'black',
          border: '1px solid gray',
          padding: '0.5rem',
          marginTop: '0.5rem'
        }}
      />
      <FormWarningText text={errors.password?.message?.toString()} />

      <Link href={app.urls.forgotPassword} size='sm' style={{ marginTop: '0.5rem', color: curTheme === 'dark' ? 'white' : 'black' }}>
        Forgot password?
      </Link>
      <Button type="submit" style={{ marginTop: '1.5rem', backgroundColor: curTheme === 'dark' ? 'white' : 'black', color: curTheme === 'dark' ? 'black' : 'white' }}>
        Sign In
      </Button>
    </form>
  );
}
