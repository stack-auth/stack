'use client';;
import { useEffect, useState } from "react";
import FormWarningText from "./form-warning";
import { validateEmail } from "../utils/email";
import { useStackApp } from "..";
import { Button, Input, Label } from "../components-core";

export default function MagicLinkSignIn() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
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
      setError('Please enter your email');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    const error = await app.sendMagicLinkEmail(email);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
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
          setError('');
        }}
      />
      <FormWarningText text={error} />

      <Button
        disabled={sent}
        style={{ marginTop: '1.5rem' }}
        onClick={onSubmit}
      >
        {sent ? 'Email sent' : 'Send magic link'}
      </Button>
    </div>
  );
}
