'use client';

import { yupResolver } from "@hookform/resolvers/yup";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { Button, Input, Label, Typography } from "@stackframe/stack-ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { useUser } from "..";
import { FormWarningText } from "../components/elements/form-warning";
import { MaybeFullPage } from "../components/elements/maybe-full-page";

const schema = yupObject({
  displayName: yupString().required('Please enter a team name'),
});

export function TeamCreation(props: { fullPage?: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });
  const user = useUser({ or: 'redirect' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);

    try {
      const error = await user.createTeam({
        displayName: data.displayName,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MaybeFullPage fullPage={props.fullPage}>
      <div className='stack-scope flex flex-col items-stretch'>
        <div className="text-center mb-6">
          <Typography type='h2'>
            Create a Team
          </Typography>
        </div>
        <form
          className="flex flex-col items-stretch stack-scope"
          onSubmit={e => runAsynchronously(handleSubmit(onSubmit)(e))}
          noValidate
        >
          <Label htmlFor="email" className="mb-1">Display name</Label>
          <Input
            id="email"
            type="email"
            {...register('displayName')}
          />
          <FormWarningText text={errors.displayName?.message?.toString()} />

          <Button type="submit" className="mt-6" loading={loading}>
            Create
          </Button>
        </form>
      </div>
    </MaybeFullPage>
  );
}