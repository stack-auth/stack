'use client';;
import { AuthPage } from "@stackframe/stack";
import { ProjectForm, ProjectFormValues, projectFormSchema } from "./form";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const defaultValues: Partial<ProjectFormValues> = {
  displayName: "",
  signInMethods: ["credential", "magicLink", "google", "github"],
};

export default function PageClient () {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const mockProject = {
    id: "id",
    credentialEnabled: form.watch("signInMethods").includes("credential"),
    magicLinkEnabled: form.watch("signInMethods").includes("magicLink"),
    oauthProviders: (["google", "facebook", "github", "microsoft"] as const).map(provider => ({
      id: provider,
      enabled: form.watch("signInMethods").includes(provider),
    })),
  };

  return (
    <div className="w-full flex-grow flex items-center justify-center">
      <div className="w-full md:w-1/2 p-4">
        <div className='max-w-xs m-auto'>
          <ProjectForm form={form} />
        </div>
      </div>
      <Separator orientation="vertical" />

      <div className="w-1/2 self-stretch p-4 bg-gray-300 dark:bg-gray-700 hidden md:flex">
        {mockProject ? 
          (
            <div className='w-full sm:max-w-sm m-auto scale-90'>
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