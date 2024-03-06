'use client';

import { useState } from "react";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { useStackApp } from "..";
import { PasswordField } from "./PasswordField";
import { FormWarningText } from "./FormWarning";
import RedirectMessageCard from "./RedirectMessageCard";
import MessageCard from "./MessageCard";
import CardFrame from "./CardFrame";
import CardHeader from "./CardHeader";


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
        <p>Failed to reset password. Please request a new password reset link</p>
      </MessageCard>
    );
  }

  return (
    <CardFrame fullPage={fullPage}>
      <CardHeader title="Reset Your Password" />
      <div className="wl_flex wl_flex-col wl_space-y-2 wl_items-stretch">
        <div className="wl_form-control">
          <label className="wl_label" htmlFor="password">
          New Password
          </label>
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
        </div>

        <div className="wl_form-control">
          <label className="wl_label" htmlFor="repeat-password">
          Repeat New Password
          </label>
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
        </div>

        <div className="wl_flex wl_flex-col wl_items-stretch">
          <button className="wl_btn wl_btn-primary wl_mt-6" onClick={() => void onSubmit()}>Reset Password</button>
        </div>
      </div>
    </CardFrame>
  ); 
}