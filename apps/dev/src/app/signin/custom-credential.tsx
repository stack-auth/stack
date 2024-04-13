/* eslint-disable @typescript-eslint/no-misused-promises */
'use client';
import { useStackApp } from "@stackframe/stack";
import { useState } from "react";

export default function CustomCredentialSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const app = useStackApp();

  const onSubmit = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }
    const error = await app.signInWithCredential({ email, password });
    // It is better to handle each error code separately, but for simplicity, we will just show the error code directly
    if (error) {
      setError(error.message);
    }
  };
  
  return (
    <div>
      {error}
      <input type='email' placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type='password' placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={onSubmit}>Sign In</button>
    </div>
  );
}
