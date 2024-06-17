'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { useStackApp } from "..";
import PasswordField from "./password-field";
import FormWarningText from "./form-warning";
import PredefinedMessageCard from "./message-cards/predefined-message-card";
import MessageCard from "./message-cards/message-card";
import MaybeFullPage from "./maybe-full-page";
import { Button, Label, Text } from "../components-core";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";

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

export default function PasswordResetInner(
  { code, fullPage = false }:
  { code: string, fullPage?: boolean }
) {
  const { register, handleSubmit, formState: { errors }, clearErrors } = useForm({
    resolver: yupResolver(schema)
  });
  const stackApp = useStackApp();
  const [finished, setFinished] = useState(false);
  const [resetError, setResetError] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    const { password } = data;
    const errorCode = await stackApp.resetPassword({ password, code });
    if (errorCode) {
      setResetError(true);
      return;
    }

    setFinished(true);
  };

  if (finished) {
    return <PredefinedMessageCard type='passwordReset' fullPage={fullPage} />;
  }

  if (resetError) {
    return (
      <MessageCard title="Failed to reset password" fullPage={fullPage}>
        <Text>Failed to reset password. Please request a new password reset link</Text>
      </MessageCard>
    );
  }

  return (
    <MaybeFullPage fullPage={fullPage}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <Text size="xl" as='h2'>Reset Your Password</Text>
      </div>

      <form 
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }} 
        onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
        noValidate
      >
        <Label htmlFor="password">New Password</Label>
        <PasswordField
          id="password"
          {...register('password')}
          onChange={() => {
            clearErrors('password');
            clearErrors('passwordRepeat');
          }}
        />
        <FormWarningText text={errors.password?.message?.toString()} />

        <Label htmlFor="repeat-password" style={{ marginTop: "1rem" }}>Repeat New Password</Label>
        <PasswordField
          id="repeat-password"
          {...register('passwordRepeat')}
          onChange={() => {
            clearErrors('password');
            clearErrors('passwordRepeat');
          }}
        />
        <FormWarningText text={errors.passwordRepeat?.message?.toString()} />

        <Button style={{ marginTop: '1.5rem' }} type="submit">
          Reset Password
        </Button>
      </form>
    </MaybeFullPage>
  ); 
}
