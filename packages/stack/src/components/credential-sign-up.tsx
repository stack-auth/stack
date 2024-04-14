'use client';

import { useState } from "react";
import PasswordField from "./password-field";
import FormWarningText from "./form-warning";
import { validateEmail } from "../utils/email";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { useStackApp } from "..";
import { Label, Input, AsyncButton } from "../components-core";
import { KnownErrors } from "@stackframe/stack-shared";

export default function CredentialSignUp() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [passwordRepeatError, setPasswordRepeatError] = useState('');
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

    const passwordError = getPasswordError(password);
    if (passwordError) {
      setPasswordError(passwordError.message);
      return;
    }

    let error;
    error = await app.signUpWithCredential({ email, password });
    
    if (error instanceof KnownErrors.UserEmailAlreadyExists) {
      setEmailError('User already exists');
    } else if (error) {
      setEmailError(`An error occurred. ${error.message}`);
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
        onClick={onSubmit}
      >
          Sign Up
      </Button>
    </div>
  );
}
