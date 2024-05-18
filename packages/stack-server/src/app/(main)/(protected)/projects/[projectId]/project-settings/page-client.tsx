"use client";;
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingInput, SettingSwitch } from "@/components/settings";
import { Alert } from "@/components/ui/alert";
import { Link } from "@/components/link";
import Typography from "@/components/ui/typography";

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();
  const productionModeErrors = project.getProductionModeErrors();

  return (
    <PageLayout title="Project Settings" description="Manage your project">
      <SettingCard title="Public Project Information">
        <SettingInput 
          label="Display name" 
          onChange={(v) => project.update({ displayName: v })}
          defaultValue={project.displayName}/>

        <SettingInput
          label="Description"
          onChange={(v) => project.update({ description: v })}
          defaultValue={project.description}
        />

        <Typography variant="secondary" type="footnote">
          The display name and description may be publicly visible to users of your app.
        </Typography>
      </SettingCard>

      <SettingCard title="Production mode" description="Production mode disallows certain configuration options that are useful for development but deemed unsafe for production usage. To prevent accidental misconfigurations, it is strongly recommended to enable production mode on your production environments.">
        <SettingSwitch
          label="Enable production mode"
          checked={project.isProductionMode}
          disabled={!project.isProductionMode && productionModeErrors.length > 0}
          onCheckedChange={async (checked) => {
            await project.update({
              isProductionMode: checked,
            });
          }}
        />

        {productionModeErrors.length === 0 ? (
          <Alert>
            Your configuration is ready for production and production mode can be enabled. Good job!
          </Alert>
        ) : (
          <Alert variant='destructive'>
            Your configuration is not ready for production mode. Please fix the following issues:
            <ul className="mt-2 list-disc pl-5">
              {productionModeErrors.map((error) => (
                <li key={error.errorMessage}>
                  {error.errorMessage} (<Link href={error.fixUrlRelative}>show configuration</Link>)
                </li>
              ))}
            </ul>
          </Alert>
        )}
      </SettingCard>
      
      {/* <SettingCard title="Danger Zone" description="Be careful with these settings" accordion="Danger Settings">
        <div>
          <ActionDialog
            danger
            title="Delete Project"
            trigger={<Button variant="destructive">Delete Project</Button>}
            okButton={{ label: "Delete Project", onClick: async () => {
              // await project.delete();
              // stackAdminApp.router.push("/projects");
            }}}
            confirmText="I understand that all the users, teams, and data associated with this project will be permanently deleted. This action cannot be undone."
          >
            {`Are you sure that you want to delete the project "${project.displayName}" with the id of "${project.id}"?`}
          </ActionDialog>
        </div>
      </SettingCard> */}
    </PageLayout>
  );
}
