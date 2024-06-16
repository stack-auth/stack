'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormWarningText from "./form-warning";
import { useStackApp } from "..";
import { Button, Input, Label } from "../components-core";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { useEffect } from "react";

const schema = yup.object().shape({
  email: yup.string().email('Please enter a valid email').required('Please enter your email')
});

export default function MagicLinkSignIn() {
  const { register, handleSubmit, setError, formState: { errors }, clearErrors } = useForm({
    resolver: yupResolver(schema)
  });
  const [curTheme, setCurrentTheme] = useState('light')
  const [sent, setSent] = useState(false);
  const app = useStackApp();
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
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
      noValidate
    >

      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        {...register('email')}
        disabled={sent}
        style={{
          backgroundColor: curTheme === 'dark' ? 'black' : 'white',
          color: curTheme === 'dark' ? 'white' : 'black',
          border: '1px solid gray',
          padding: '0.5rem',
          marginTop: '0.5rem'
        }}
      />
      <FormWarningText text={errors.email?.message?.toString()} />

      <Button disabled={sent} style={{ marginTop: '1.5rem', backgroundColor: curTheme === 'dark' ? 'white' : 'black', color: curTheme === 'dark' ? 'black' : 'white' }} type="submit">
        {sent ? 'Email sent!' : 'Send magic link'}
      </Button>
    </form>
  );
}

