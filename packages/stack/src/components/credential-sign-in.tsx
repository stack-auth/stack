"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Button, Input, Label, PasswordInput, StyledLink } from "@stackframe/stack-ui";
import { useStackApp } from "..";
import { FormWarningText } from "./elements/form-warning";

const schema = yupObject({
  email: yupString().email("Please enter a valid email").required("Please enter your email"),
  password: yupString().required("Please enter your password"),
});

export function CredentialSignIn() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const app = useStackApp();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);

    try {
      const { email, password } = data;
      const error = await app.signInWithCredential({
        email,
        password,
      });
      setError("email", { type: "manual", message: error?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="stack-scope flex flex-col items-stretch"
      onSubmit={(e) => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
      noValidate
    >
      <Label htmlFor="email" className="mb-1">
        Email
      </Label>
      <Input id="email" type="email" {...register("email")} />
      <FormWarningText text={errors.email?.message?.toString()} />

      <Label htmlFor="password" className="mb-1 mt-4">
        Password
      </Label>
      <PasswordInput id="password" {...register("password")} />
      <FormWarningText text={errors.password?.message?.toString()} />

      <StyledLink href={app.urls.forgotPassword} className="mt-1 text-sm">
        Forgot password?
      </StyledLink>

      <Button type="submit" className="mt-6" loading={loading}>
        Sign In
      </Button>
    </form>
  );
}
