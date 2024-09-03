"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { AuthPage, useUser } from "@stackframe/stack";
import { runAsynchronouslyWithAlert, wait } from "@stackframe/stack-shared/dist/utils/promises";
import { BrowserFrame, Button, Form, Separator, Typography } from "@stackframe/stack-ui";
import { InputField, SwitchListField } from "@/components/form-fields";
import { useRouter } from "@/components/router";

export const projectFormSchema = yup.object({
  displayName: yup.string().min(1, "Display name is required").required(),
  signInMethods: yup
    .array(yup.string().oneOf(["google", "github", "microsoft", "facebook", "credential", "magicLink", "discord", "gitlab"]).required())
    .required(),
});

export type ProjectFormValues = yup.InferType<typeof projectFormSchema>;

export const defaultValues: Partial<ProjectFormValues> = {
  displayName: "",
  signInMethods: ["credential", "google", "github"],
};

export default function PageClient() {
  const user = useUser({ or: "redirect", projectIdMustMatch: "internal" });
  const [loading, setLoading] = useState(false);
  const form = useForm<ProjectFormValues>({
    resolver: yupResolver<ProjectFormValues>(projectFormSchema),
    defaultValues,
    mode: "onChange",
  });
  const router = useRouter();

  const mockProject = {
    id: "id",
    config: {
      signUpEnabled: true,
      credentialEnabled: form.watch("signInMethods").includes("credential"),
      magicLinkEnabled: form.watch("signInMethods").includes("magicLink"),
      oauthProviders: form
        .watch("signInMethods")
        .filter((method) => ["google", "github", "microsoft", "facebook"].includes(method))
        .map((provider) => ({ id: provider, type: "shared" })),
    },
  };

  const onSubmit = async (values: ProjectFormValues, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    setLoading(true);
    let newProject;
    try {
      newProject = await user.createProject({
        displayName: values.displayName,
        config: {
          credentialEnabled: values.signInMethods.includes("credential"),
          magicLinkEnabled: values.signInMethods.includes("magicLink"),
          oauthProviders: (["google", "facebook", "github", "microsoft"] as const)
            .map(
              (provider) =>
                ({
                  id: provider,
                  enabled: values.signInMethods.includes(provider),
                  type: "shared",
                }) as const,
            )
            .filter(({ enabled }) => enabled),
        },
      });
      router.push("/projects/" + newProject.id);
      await wait(2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-grow items-center justify-center">
      <div className="w-full p-4 md:w-1/2">
        <div className="m-auto max-w-xs">
          <div className="mb-4 flex justify-center">
            <Typography type="h2">Create a new project</Typography>
          </div>

          <Form {...form}>
            <form onSubmit={(e) => runAsynchronouslyWithAlert(form.handleSubmit(onSubmit)(e))} className="space-y-4">
              <InputField required control={form.control} name="displayName" label="Display Name" placeholder="My Project" />

              <SwitchListField
                control={form.control}
                name="signInMethods"
                label="Sign-In Methods"
                options={[
                  { value: "credential", label: "Email password" },
                  { value: "magicLink", label: "Magic link" },
                  { value: "google", label: "Google" },
                  { value: "github", label: "GitHub" },
                  { value: "microsoft", label: "Microsoft" },
                  { value: "facebook", label: "Facebook" },
                ]}
              />

              <div className="flex justify-center">
                <Button loading={loading} type="submit">
                  Create project
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      <Separator orientation="vertical" />

      <div className="hidden w-1/2 items-center self-stretch bg-zinc-300 px-4 py-4 dark:bg-zinc-800 md:flex lg:px-20">
        {
          <div className="w-full">
            <BrowserFrame url="your-website.com/signin">
              <div className="flex min-h-[400px] flex-col items-center justify-center">
                <div className="m-auto w-full scale-90 sm:max-w-xs" inert="">
                  {/* a transparent cover that prevents the card being clicked */}
                  <div className="absolute inset-0 z-10 bg-transparent"></div>
                  <AuthPage type="sign-in" mockProject={mockProject} />
                </div>
              </div>
            </BrowserFrame>
          </div>
        }
      </div>
    </div>
  );
}
