'use client';

import { useState } from "react";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { useStackApp } from "..";
import { PasswordField } from "./password-field";
import { FormWarningText } from "./form-warning";
import RedirectMessageCard from "./redirect-message-card";
import MessageCard from "./message-card";
import CardFrame from "./card-frame";
import CardHeader from "./card-header";
import { Button, Label, Text } from "@stackframe/stack-ui";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";


export default function PasswordResetInner(
  { code, fullPage = false }:
  { code: string, fullPage?: boolean }
) {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [passwordRepeatError, setPasswordRepeatError] = useState('');
  const [finished, setFinished] = useState(false);
  const [resetError, setResetError] = useState(false);
  const stackApp = useStackApp();

  const onSubmit = async () => {
    if (!password) {
      setPasswordError('Please enter your password');
      return;
    }
    if (!passwordRepeat) {
      setPasswordRepeatError('Please repeat your password');
      return;
    }
    if (password !== passwordRepeat) {
      setPasswordRepeatError('Passwords do not match');
      return;
    }

    const errorMessage = getPasswordError(password);
    if (errorMessage) {
      setPasswordError(errorMessage);
      return;
    }

    const errorCode = await stackApp.resetPassword({ password, code });
    
    // this should not happen, the outer component should verify the code before rendering this component
    if (errorCode) {
      setResetError(true);
      return;
    }

    setFinished(true);
  };

  if (finished) {
    return <RedirectMessageCard type='passwordReset' fullPage={fullPage} />;
  }

  if (resetError) {
    return (
      <MessageCard title="Failed to reset password" fullPage={fullPage}>
        <Text>Failed to reset password. Please request a new password reset link</Text>
      </MessageCard>
    );
  }

  return (
    <CardFrame fullPage={fullPage}>
      <CardHeader title="Reset Your Password" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <Label htmlFor="password">New Password</Label>
        <PasswordField
          id="password"
          name="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError('');
            setPasswordRepeatError('');
          }}
        />
        <FormWarningText text={passwordError} />

        <Label htmlFor="repeat-password" style={{ marginTop: "1rem" }}>Repeat New Password</Label>
        <PasswordField
          id="repeat-password"
          name="repeat-password"
          value={passwordRepeat}
          onChange={(e) => {
            setPasswordRepeat(e.target.value);
            setPasswordError('');
            setPasswordRepeatError('');
          }}
        />
        <FormWarningText text={passwordRepeatError} />

        <Button style={{ marginTop: '1.5rem' }} onClick={() => runAsynchronously(onSubmit())}>
          Reset Password
        </Button>
      </div>
    </CardFrame>
  ); 
}