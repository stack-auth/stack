'use client';

import { useState } from "react";
import { FormWarningText } from "./FormWarning";
import { validateEmail } from "../utils/email";
import { useStackApp } from "..";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import Button from "./Button";


export default function ForgotPassword({ onSent }: { onSent?: () => void }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sending, setSending] = useState(false);
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
    setSending(true);
    await stackApp.sendForgotPasswordEmail(email);
    setSending(false);

    onSent?.();
  };

  return (
    <div className="wl_flex wl_flex-col wl_space-y-2 wl_items-stretch">
      <div className="wl_form-control">
        <label className="wl_label" htmlFor="email">
          <span className="wl_label-text">Your Email</span>
        </label>
        <input
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
      </div>

      <div className="wl_flex wl_flex-col wl_items-stretch">
        <Button
          className="wl_btn-primary wl_mt-6" 
          onClick={() => runAsynchronously(onSubmit())}
          loading={sending}
        >
          Send Email
        </Button>
      </div>
    </div>
  );
}
