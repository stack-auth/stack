'use client';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import PasswordField from "./password-field";
import FormWarningText from "./form-warning";
import { useStackApp } from "..";
import { Label, Input, Button } from "../components-core";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { useEffect, useState } from "react";

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
  const [curTheme, setCurrentTheme] = useState('light')
  const app = useStackApp();

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    const { email, password } = data;
    const error = await app.signUpWithCredential({ email, password });
    setError('email', { type: 'manual', message: error?.message });
  };
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
        onChange={(e) => {
          clearErrors('password');
          clearErrors('passwordRepeat');
        }}
        style={{
          backgroundColor: curTheme === 'dark' ? 'black' : 'white',
          color: curTheme === 'dark' ? 'white' : 'black',
          border: '1px solid gray',
          padding: '0.5rem',
          marginTop: '0.5rem'
        }}
      />
      <FormWarningText text={errors.password?.message?.toString()} />

      <Label htmlFor="repeat-password" style={{ marginTop: '1rem' }}>Repeat Password</Label>
      <PasswordField
        id="repeat-password"
        {...register('passwordRepeat')}
        onChange={(e) => {
          clearErrors('password');
          clearErrors('passwordRepeat');
        }}
        style={{
          backgroundColor: curTheme === 'dark' ? 'black' : 'white',
          color: curTheme === 'dark' ? 'white' : 'black',
          border: '1px solid gray',
          padding: '0.5rem',
          marginTop: '0.5rem'
        }}
      />
      <FormWarningText text={errors.passwordRepeat?.message?.toString()} />

      <Button type="submit" style={{ marginTop: '1.5rem', backgroundColor: curTheme === 'dark' ? 'white' : 'black', color: curTheme === 'dark' ? 'black' : 'white' }}>
        Sign Up
      </Button>
    </form>
  );
}

