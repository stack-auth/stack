import { AuthPage } from "@stackframe/stack";
import { ProjectForm } from "./form";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

export default function Page () {
  return (
    <div className="w-full flex-grow flex items-center justify-center">
      <div className="w-1/2 p-4">
        <div className='max-w-xs m-auto'>
          <ProjectForm />
        </div>
      </div>
      <Separator orientation="vertical" />

      <div className="flex w-1/2 self-stretch p-4 bg-gray-300 dark:bg-gray-700">
        <div className='w-full sm:max-w-sm m-auto scale-90'>
          {/* a transparent cover that prevents the card being clicked */}
          <div className="absolute inset-0 bg-transparent z-10"></div>

          <Card className="p-6">
            <AuthPage 
              type="sign-in" 
              mockProject={{ 
                id: 'id',
                credentialEnabled: true,
                magicLinkEnabled: true,
                oauthProviders: [{ id: 'google', enabled: true }],
              }} 
            />
          </Card>
        </div>
      </div>
    </div>
  );
}