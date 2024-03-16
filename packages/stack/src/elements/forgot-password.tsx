'use client';

import { useState } from "react";
import { FormWarningText } from "./form-warning";
import { validateEmail } from "../utils/email";
import { useStackApp } from "..";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { useElements } from "@stackframe/stack-ui";


export default function ForgotPassword({ onSent }: { onSent?: () => void }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sending, setSending] = useState(false);
  const stackApp = useStackApp();
  const { Button, Input, Label } = useElements();
  
  const onSubmit = async () => {
    if (!email) {
      setEmailError('Please enter your email');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
    setSending(true);
    await stackApp.sendForgotPasswordEmail(email);
    setSending(false);

    onSent?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      <Label htmlFor="email">Your Email</Label>
      <Input
        id="email"
        type="email"
        name="email"
        className="wl_input wl_input-bordered"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError('');
        }}
      />
      <FormWarningText text={emailError} />

      <Button
        style={{ marginTop: '1.5rem'}}
        onClick={() => runAsynchronously(onSubmit())}
        loading={sending}
      >
          Send Email
      </Button>
    </div>
  );
}
