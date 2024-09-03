'use client';

import { yupResolver } from "@hookform/resolvers/yup";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Button, Input, Label, StyledLink, Typography } from "@stackframe/stack-ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { useStackApp, useUser } from "..";
import { FormWarningText } from "../components/elements/form-warning";
import { MaybeFullPage } from "../components/elements/maybe-full-page";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";

const schema = yupObject({
  email: yupString().email('Please enter a valid email').required('Please enter your email')
});

export function ForgotPasswordForm({ onSent }: { onSent?: () => void }) {
  const { register, handleSubmit, formState: { errors }, clearErrors } = useForm({
    resolver: yupResolver(schema)
  });
  const stackApp = useStackApp();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);
    try {
      const { email } = data;
      await stackApp.sendForgotPasswordEmail(email);
    onSent?.();
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
      <Label htmlFor="email" className="mb-1">Your Email</Label>
      <Input
        id="email"
        type="email"
        {...register('email')}
        onChange={() => clearErrors('email')}
      />
      <FormWarningText text={errors.email?.message?.toString()} />

      <Button type="submit" className="mt-6" loading={loading}>
        Send Email
      </Button>
    </form>
  );
}


export function ForgotPassword({ fullPage=false }: { fullPage?: boolean }) {
  const stackApp = useStackApp();
  const user = useUser();
  const [sent, setSent] = useState(false);

  if (user) {
    return <PredefinedMessageCard type='signedIn' fullPage={fullPage} />;
  }

  if (sent) {
    return <PredefinedMessageCard type='emailSent' fullPage={fullPage} />;
  }

  return (
    <MaybeFullPage fullPage={fullPage}>
      <div className="text-center mb-6 stack-scope" style={{ width: '380px', padding: fullPage ? '1rem' : 0 }}>
        <Typography type='h2'>Reset Your Password</Typography>
        <Typography>
          {"Don't need to reset? "}
          <StyledLink href={stackApp.urls['signUp']}>
            Sign in
          </StyledLink>
        </Typography>
      </div>
      <ForgotPasswordForm onSent={() => setSent(true)} />
    </MaybeFullPage>
  );
}
