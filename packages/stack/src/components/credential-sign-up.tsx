"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { runAsynchronously, runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Button, Input, Label, PasswordInput } from "@stackframe/stack-ui";
import { useStackApp } from "..";
import { FormWarningText } from "./elements/form-warning";

const schema = yupObject({
  email: yupString().email("Please enter a valid email").required("Please enter your email"),
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
    .oneOf([yup.ref("password"), "", null], "Passwords do not match")
    .required("Please repeat your password"),
});

export function CredentialSignUp() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    clearErrors,
  } = useForm({
    resolver: yupResolver(schema),
  });
  const app = useStackApp();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);
    try {
      const { email, password } = data;
      const error = await app.signUpWithCredential({ email, password });
      setError("email", { type: "manual", message: error?.message });
    } finally {
      setLoading(false);
    }
  };

  const registerPassword = register("password");
  const registerPasswordRepeat = register("passwordRepeat");

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
      <PasswordInput
        id="password"
        {...registerPassword}
        onChange={(e) => {
          clearErrors("password");
          clearErrors("passwordRepeat");
          runAsynchronously(registerPassword.onChange(e));
        }}
      />
      <FormWarningText text={errors.password?.message?.toString()} />

      <Label htmlFor="repeat-password" className="mb-1 mt-4">
        Repeat Password
      </Label>
      <PasswordInput
        id="repeat-password"
        {...registerPasswordRepeat}
        onChange={(e) => {
          clearErrors("password");
          clearErrors("passwordRepeat");
          runAsynchronously(registerPasswordRepeat.onChange(e));
        }}
      />
      <FormWarningText text={errors.passwordRepeat?.message?.toString()} />

      <Button type="submit" className="mt-6" loading={loading}>
        Sign Up
      </Button>
    </form>
  );
}
