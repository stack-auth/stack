'use client';

import { useState } from "react";
import { PasswordField } from "./PasswordField";
import { FormWarningText } from "./FormWarning";
import { validateEmail } from "../utils/email";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { useStackApp } from "..";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import Button from "./Button";
import { UserAlreadyExistErrorCode } from "@stackframe/stack-shared/dist/utils/types";

export default function CredentialSignUp() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [passwordRepeatError, setPasswordRepeatError] = useState('');
  const [loading, setLoading] = useState(false);
  const app = useStackApp();

  const onSubmit = async () => {
    if (!email) {
      setEmailError('Please enter your email');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
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

    setLoading(true);
    const errorCode = await app.signUpWithCredential({ email, password });
    setLoading(false);
    
    switch (errorCode) {
      case UserAlreadyExistErrorCode: {
        setEmailError('User already exists');
        break;
      }
      case undefined: {
        // success
        await app.redirectToAfterSignIn();
      }
    }
  };

  return (
    <div className="wl_flex wl_flex-col wl_space-y-2 wl_items-stretch">
      <div className="wl_form-control">
        <label className="wl_label" htmlFor="email">
          Email
        </label>
        <input
          className="wl_input wl_input-bordered"
          id="email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError('');
          }}
        />
        <FormWarningText text={emailError} />
      </div>

      <div className="wl_form-control">
        <label className="wl_label" htmlFor="password">
          Password
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
          Repeat Password
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
        <Button 
          className="wl_btn-primary wl_mt-6"
          onClick={() => runAsynchronously(onSubmit)}
          loading={loading}
        >
          Sign Up
        </Button>
      </div>
    </div>
  );
}
