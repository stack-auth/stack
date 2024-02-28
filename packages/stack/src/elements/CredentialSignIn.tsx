import { useState } from "react";
import { FormWarningText } from "./FormWarning";
import { PasswordField } from "./PasswordField";
import { validateEmail } from "../utils/email";
import NextLink from "next/link";
import { useStackApp } from "..";
import Button from "./Button";
import { runAsynchronously } from "stack-shared/dist/utils/promises";
import { EmailPasswordMissMatchErrorCode, UserNotExistErrorCode } from "stack-shared/dist/utils/types";
// Import or define the PasswordField, FormWarningText, and validateEmail utilities if they're custom components or functions.

export default function CredentialSignIn({ redirectUrl }: { redirectUrl?: string }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (!password) {
      setPasswordError('Please enter your password');
      return;
    }
    
    setLoading(true);
    const errorCode = await stackApp.signInWithCredential({ email, password, redirectUrl });
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
    <div className="wl_flex wl_flex-col wl_space-y-2 wl_items-stretch">
      <div className="wl_form-control">
        <label className="wl_label" htmlFor="email">
          <span className="wl_label-text">Email</span>
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

      <div className="wl_form-control">
        <label className="wl_label" htmlFor="password">
          <span className="wl_label-text">Password</span>
        </label>
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
      </div>

      {/* forgot password */}
      <div className="wl_flex wl_items-center wl_justify-between">
        <NextLink 
          href={stackApp.urls.forgotPassword} 
          className="wl_text-sm wl_text-blue-500 wl_no-underline wl_hover:wl_underline">
          Forgot password?
        </NextLink>
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
