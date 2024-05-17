"use client";;
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingInput, SettingSwitch } from "@/components/settings";
import { Button } from "@/components/ui/button";
import { ActionDialog } from "@/components/action-dialog";

export default function TeamSettingsClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  return (
    <PageLayout title="Project Settings" description="Manage your project">
      <SettingCard title="Project Information">
        <SettingInput 
          label="Display Name" 
          onChange={(v) => project.update({ displayName: v })}
          defaultValue={project.displayName}/>
        <SettingInput
          label="Description"
          onChange={(v) => project.update({ description: v })}
          defaultValue={project.description}
        />
      </SettingCard>

      <SettingCard title="Danger Zone" description="Be careful with these settings" accordion="Danger Settings">
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
      </SettingCard>
    </PageLayout>
  );
}
