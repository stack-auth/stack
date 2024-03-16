'use client';

import { useState } from "react";
import { PasswordField } from "./password-field";
import { FormWarningText } from "./form-warning";
import { validateEmail } from "../utils/email";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { useStackApp } from "..";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { UserAlreadyExistErrorCode } from "@stackframe/stack-shared/dist/utils/types";
import { useElements } from "@stackframe/stack-ui";

export default function CredentialSignUp() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [passwordRepeatError, setPasswordRepeatError] = useState('');
  const [loading, setLoading] = useState(false);
  const app = useStackApp();
  const { Button, Label, Input } = useElements();

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
        break;
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      <Label htmlFor="email">Email</Label>
      <Input
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

      <Label htmlFor="password" style={{ marginTop: '1rem' }}>Password</Label>
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
        
      <Label htmlFor="repeat-password" style={{ marginTop: '1rem' }}>Repeat Password</Label>
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

      <Button 
        style={{ marginTop: '1.5rem' }}
        onClick={() => runAsynchronously(onSubmit)}
        loading={loading}
      >
          Sign Up
      </Button>
    </div>
  );
}
