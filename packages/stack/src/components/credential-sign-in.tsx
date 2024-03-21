import { useState } from "react";
import { FormWarningText } from "./form-warning";
import { PasswordField } from "./password-field";
import { validateEmail } from "../utils/email";
import { useStackApp } from "..";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { EmailPasswordMissMatchErrorCode, UserNotExistErrorCode } from "@stackframe/stack-shared/dist/utils/types";
import { Button, Input, Label, Link } from "../components-core";
// Import or define the PasswordField, FormWarningText, and validateEmail utilities if they're custom components or functions.

export default function CredentialSignIn() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
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
    
    setLoading(true);
    const errorCode = await app.signInWithCredential({ email, password });
    setLoading(false);
  
    switch (errorCode) {
      case UserNotExistErrorCode: {
        setEmailError('User does not exist');
        break;
      }
      case EmailPasswordMissMatchErrorCode: {
        setPasswordError('Wrong email or password');
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
        }}
      />
      <FormWarningText text={passwordError} />

      <Link href={app.urls.forgotPassword} size='sm' style={{ marginTop: '0.5rem' }}>
        Forgot password?
      </Link>

      <Button
        style={{ marginTop: '1.5rem' }}
        onClick={() => runAsynchronously(onSubmit)}
        loading={loading}
      >
          Sign In
      </Button>
    </div>
  );
}
