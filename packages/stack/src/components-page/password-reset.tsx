"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { KnownErrors } from "@stackframe/stack-shared";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { cacheFunction } from "@stackframe/stack-shared/dist/utils/caches";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Button, Label, PasswordInput, Typography } from "@stackframe/stack-ui";
import { StackClientApp, useStackApp } from "..";
import { FormWarningText } from "../components/elements/form-warning";
import { MaybeFullPage } from "../components/elements/maybe-full-page";
import { MessageCard } from "../components/message-cards/message-card";
import { PredefinedMessageCard } from "../components/message-cards/predefined-message-card";

const schema = yupObject({
  password: yupString()
    .required("Please enter your password")
    .test({
      name: "is-valid-password",
      test: (value, ctx) => {
        const error = getPasswordError(value);
        if (error) {
          return ctx.createError({ message: error.message });
        } else {
          return true;
        }
      },
    }),
  passwordRepeat: yupString()
    .nullable()
    .oneOf([yup.ref("password"), null], "Passwords do not match")
    .required("Please repeat your password"),
});

export default function PasswordResetForm({ code, fullPage = false }: { code: string; fullPage?: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm({
    resolver: yupResolver(schema),
  });
  const stackApp = useStackApp();
  const [finished, setFinished] = useState(false);
  const [resetError, setResetError] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);
    try {
      const { password } = data;
      const errorCode = await stackApp.resetPassword({ password, code });
      if (errorCode) {
        setResetError(true);
        return;
      }

      setFinished(true);
    } finally {
      setLoading(false);
    }
  };

  if (finished) {
    return <PredefinedMessageCard type="passwordReset" fullPage={fullPage} />;
  }

  if (resetError) {
    return (
      <MessageCard title="Failed to reset password" fullPage={fullPage}>
        Failed to reset password. Please request a new password reset link
      </MessageCard>
    );
  }

  return (
    <MaybeFullPage fullPage={fullPage}>
      <div className="mb-6 text-center" style={{ width: "380px", padding: fullPage ? "1rem" : 0 }}>
        <Typography type="h2">Reset Your Password</Typography>
      </div>

      <form
        style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}
        onSubmit={(e) => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
        noValidate
      >
        <Label htmlFor="password" className="mb-1">
          New Password
        </Label>
        <PasswordInput
          id="password"
          {...register("password")}
          onChange={() => {
            clearErrors("password");
            clearErrors("passwordRepeat");
          }}
        />
        <FormWarningText text={errors.password?.message?.toString()} />

        <Label htmlFor="repeat-password" className="mb-1 mt-4">
          Repeat New Password
        </Label>
        <PasswordInput
          id="repeat-password"
          {...register("passwordRepeat")}
          onChange={() => {
            clearErrors("password");
            clearErrors("passwordRepeat");
          }}
        />
        <FormWarningText text={errors.passwordRepeat?.message?.toString()} />

        <Button type="submit" className="mt-6" loading={loading}>
          Reset Password
        </Button>
      </form>
    </MaybeFullPage>
  );
}

const cachedVerifyPasswordResetCode = cacheFunction(async (stackApp: StackClientApp<true>, code: string) => {
  return await stackApp.verifyPasswordResetCode(code);
});

export function PasswordReset({ searchParams, fullPage = false }: { searchParams: Record<string, string>; fullPage?: boolean }) {
  const stackApp = useStackApp();

  const invalidJsx = (
    <MessageCard title="Invalid Password Reset Link" fullPage={fullPage}>
      <Typography>Please double check if you have the correct password reset link.</Typography>
    </MessageCard>
  );

  const expiredJsx = (
    <MessageCard title="Expired Password Reset Link" fullPage={fullPage}>
      <Typography>Your password reset link has expired. Please request a new password reset link from the login page.</Typography>
    </MessageCard>
  );

  const usedJsx = (
    <MessageCard title="Used Password Reset Link" fullPage={fullPage}>
      <Typography>
        This password reset link has already been used. If you need to reset your password again, please request a new password reset link
        from the login page.
      </Typography>
    </MessageCard>
  );

  const code = searchParams.code;
  if (!code) {
    return invalidJsx;
  }

  const error = React.use(cachedVerifyPasswordResetCode(stackApp, code));

  if (error instanceof KnownErrors.VerificationCodeNotFound) {
    return invalidJsx;
  } else if (error instanceof KnownErrors.VerificationCodeExpired) {
    return expiredJsx;
  } else if (error instanceof KnownErrors.VerificationCodeAlreadyUsed) {
    return usedJsx;
  } else if (error) {
    throw error;
  }

  return <PasswordResetForm code={code} fullPage={fullPage} />;
}
