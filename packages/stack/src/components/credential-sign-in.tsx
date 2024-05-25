'use client';

import { useEffect, useState } from "react";
import FormWarningText from "./form-warning";
import PasswordField from "./password-field";
import { validateEmail } from "../utils/email";
import { useStackApp } from "..";
import { Button, Input, Label, Link } from "../components-core";
import { KnownErrors } from "@stackframe/stack-shared";

export default function CredentialSignIn() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const app = useStackApp();

  
  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    }
  }, [])

  const onKeyDown = (e:KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  }

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
    
    const error = await app.signInWithCredential({ email, password });

    if (error instanceof KnownErrors.EmailPasswordMismatch) {
      setPasswordError('Wrong email or password');
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
        }}
      />
      <FormWarningText text={passwordError} />

      <Link href={app.urls.forgotPassword} size='sm' style={{ marginTop: '0.5rem' }}>
        Forgot password?
      </Link>

      <Button
        style={{ marginTop: '1.5rem' }}
        onClick={onSubmit}
      >
          Sign In
      </Button>
    </div>
  );
}
