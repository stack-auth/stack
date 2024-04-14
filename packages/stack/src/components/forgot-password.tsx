'use client';

import { useState } from "react";
import FormWarningText from "./form-warning";
import { validateEmail } from "../utils/email";
import { useStackApp } from "..";
import { Button, Input, Label } from "../components-core";


export default function ForgotPassword({ onSent }: { onSent?: () => void }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const stackApp = useStackApp();
  
  const onSubmit = async () => {
    if (!email) {
      setEmailError('Please enter your email');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
    await stackApp.sendForgotPasswordEmail(email);

    onSent?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      <Label htmlFor="email">Your Email</Label>
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

      <Button
        style={{ marginTop: '1.5rem'}}
        onClick={onSubmit}
      >
          Send Email
      </Button>
    </div>
  );
}
