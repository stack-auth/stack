'use client';;
import { AuthPage, useUser } from "@stackframe/stack";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { InputField, ListSwitchField } from "@/components/form-fields";
import { runAsynchronously, wait } from "@stackframe/stack-shared/dist/utils/promises";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Typography from "@/components/ui/typography";

export const projectFormSchema = z.object({
  displayName: z.string().min(1, "Project name is required"),
  signInMethods: z.array(z.enum(["google", "github", "microsoft", "facebook", "credential", "magicLink"])),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>

export const defaultValues: Partial<ProjectFormValues> = {
  displayName: "",
  signInMethods: ["credential", "google", "github"],
};

export default function PageClient () {
  const user = useUser({ or: 'redirect', projectIdMustMatch: "internal" });
  const [loading, setLoading] = useState(false);
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
    mode: "onChange",
  });
  const router = useRouter();

  const mockProject = {
    id: "id",
    credentialEnabled: form.watch("signInMethods").includes("credential"),
    magicLinkEnabled: form.watch("signInMethods").includes("magicLink"),
    oauthProviders: (["google", "facebook", "github", "microsoft"] as const).map(provider => ({
      id: provider,
      enabled: form.watch("signInMethods").includes(provider),
    })),
  };

  const onSubmit = async (values: ProjectFormValues, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    setLoading(true);
    const { id, ...projectUpdate } = mockProject;
    let newProject;
    try {
      newProject = await user.createProject({
        displayName: values.displayName,
        ...projectUpdate,
      });
      await router.push('/projects/' + newProject.id);
      await wait(2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-grow flex items-center justify-center">
      <div className="w-full md:w-1/2 p-4">
        <div className='max-w-xs m-auto'>
          <Form {...form}>
            <div className="flex justify-center mb-4">
              <Typography type='h2'>Create a new project</Typography>
            </div>
            <form onSubmit={e => runAsynchronously(form.handleSubmit(onSubmit)(e))} className="space-y-6">

              <InputField required control={form.control} name="displayName" label="Project Name" placeholder="My Project" />

              <ListSwitchField
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
                <Button loading={loading}>Create project</Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      <Separator orientation="vertical" />

      <div className="w-1/2 self-stretch p-4 bg-zinc-300 dark:bg-zinc-800 hidden md:flex">
        {mockProject ? 
          (
            // The inert attribute is not available in typescript, so this is a hack to make type works
            <div className='w-full sm:max-w-sm m-auto scale-90' {...{ inert: '' }}>
              {/* a transparent cover that prevents the card being clicked */}
              <div className="absolute inset-0 bg-transparent z-10"></div>
              <Card className="p-6">
                <AuthPage 
                  type="sign-in" 
                  mockProject={mockProject} 
                />
              </Card>
            </div>
          ): null}
      </div> 
    </div>
  );
}