'use client';
import { InputField, SwitchListField } from "@/components/form-fields";
import { useRouter } from "@/components/router";
import { yupResolver } from "@hookform/resolvers/yup";
import { AuthPage, useUser } from "@stackframe/stack";
import { allProviders } from "@stackframe/stack-shared/dist/utils/oauth";
import { runAsynchronouslyWithAlert, wait } from "@stackframe/stack-shared/dist/utils/promises";
import { BrowserFrame, Button, Form, Separator, Typography } from "@stackframe/stack-ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

export const projectFormSchema = yup.object({
  displayName: yup.string().min(1, "Display name is required").required("Display name is required"),
  signInMethods: yup.array(yup.string().oneOf(["credential", "magicLink"].concat(allProviders)).required())
    .min(1, "At least one sign-in method is required")
    .required("At least one sign-in method is required"),
});

export type ProjectFormValues = yup.InferType<typeof projectFormSchema>

export const defaultValues: Partial<ProjectFormValues> = {
  displayName: "",
  signInMethods: ["credential", "google", "github"],
};

export default function PageClient () {
  const user = useUser({ or: 'redirect', projectIdMustMatch: "internal" });
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
      oauthProviders: form.watch('signInMethods').filter((method) => ["google", "github", "microsoft", "spotify"].includes(method)).map(provider => ({ id: provider, type: 'shared' })),
    }
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
          oauthProviders: (["google", "facebook", "github", "microsoft"] as const).map(provider => ({
            id: provider,
            enabled: values.signInMethods.includes(provider),
            type: 'shared'
          } as const)).filter(({ enabled }) => enabled),
        }
      });
      router.push('/projects/' + newProject.id);
      await wait(2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-grow flex items-center justify-center">
      <div className="w-full md:w-1/2 p-4">
        <div className='max-w-xs m-auto'>
          <div className="flex justify-center mb-4">
            <Typography type='h2'>Create a new project</Typography>
          </div>

          <Form {...form}>
            <form onSubmit={e => runAsynchronouslyWithAlert(form.handleSubmit(onSubmit)(e))} className="space-y-4">

              <InputField required control={form.control} name="displayName" label="Display Name" placeholder="My Project" />

              <SwitchListField
                control={form.control}
                name="signInMethods"
                label="Sign-In Methods"
                options={[
                  { value: "credential", label: "Email password" },
                  { value: "magicLink", label: "Magic link/OTP" },
                  { value: "google", label: "Google" },
                  { value: "github", label: "GitHub" },
                  { value: "microsoft", label: "Microsoft" },
                  { value: "spotify", label: "Spotify" },
                ]}
              />

              <div className="flex justify-center">
                <Button loading={loading} type="submit">Create project</Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      <Separator orientation="vertical" />

      <div className="w-1/2 self-stretch py-4 px-4 lg:px-20 bg-zinc-300 dark:bg-zinc-800 hidden md:flex items-center">
        {
          (
            <div className="w-full">
              <BrowserFrame url="your-website.com/signin">
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <div className='w-full sm:max-w-xs m-auto scale-90' inert=''>
                    {/* a transparent cover that prevents the card being clicked */}
                    <div className="absolute inset-0 bg-transparent z-10"></div>
                    <AuthPage
                      type="sign-in"
                      mockProject={mockProject}
                    />
                  </div>
                </div>
              </BrowserFrame>
            </div>
          )}
      </div>
    </div>
  );
}
