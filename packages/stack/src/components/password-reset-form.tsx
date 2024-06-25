'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { useStackApp } from "..";
import { FormWarningText } from "./elements/form-warning";
import { PredefinedMessageCard } from "./message-cards/predefined-message-card";
import { MessageCard } from "./message-cards/message-card";
import { MaybeFullPage } from "./elements/maybe-full-page";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Button, Label, PasswordInput, Typography } from "@stackframe/stack-ui";

const schema = yup.object().shape({
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

export default function PasswordResetForm(
  { code, fullPage = false }:
  { code: string, fullPage?: boolean }
) {
  const { register, handleSubmit, formState: { errors }, clearErrors } = useForm({
    resolver: yupResolver(schema)
  });
  const stackApp = useStackApp();
  const [finished, setFinished] = useState(false);
  const [resetError, setResetError] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);
    try {
      const { password } = data;
      const errorCode = await stackApp.resetPassword({ password, code });
      if (errorCode) {
        setResetError(true);
        return;
      }

      setFinished(true);
    } finally {
      setLoading(false);
    }
  };

  if (finished) {
    return <PredefinedMessageCard type='passwordReset' fullPage={fullPage} />;
  }

  if (resetError) {
    return (
      <MessageCard title="Failed to reset password" fullPage={fullPage}>
        Failed to reset password. Please request a new password reset link
      </MessageCard>
    );
  }

  return (
    <MaybeFullPage fullPage={fullPage}>
      <div className="text-center mb-6">
        <Typography type='h2'>Reset Your Password</Typography>
      </div>

      <form 
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }} 
        onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
        noValidate
      >
        <Label htmlFor="password" className="mb-1">New Password</Label>
        <PasswordInput
          id="password"
          {...register('password')}
          onChange={() => {
            clearErrors('password');
            clearErrors('passwordRepeat');
          }}
        />
        <FormWarningText text={errors.password?.message?.toString()} />

        <Label htmlFor="repeat-password" className="mt-4 mb-1">Repeat New Password</Label>
        <PasswordInput
          id="repeat-password"
          {...register('passwordRepeat')}
          onChange={() => {
            clearErrors('password');
            clearErrors('passwordRepeat');
          }}
        />
        <FormWarningText text={errors.passwordRepeat?.message?.toString()} />

        <Button type="submit" className="mt-6" loading={loading}>
          Reset Password
        </Button>
      </form>
    </MaybeFullPage>
  ); 
}
