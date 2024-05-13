"use client";;
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingSwitch } from "@/components/settings";

export default function TeamSettingsClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  return (
    <PageLayout title="Team Settings" description="Configure how teams are created and managed">
      <SettingCard title="Automatic Team Creation">
        <SettingSwitch
          label="Create a personal team for each user on sign-up"
          checked={project.evaluatedConfig.createTeamOnSignUp}
          onCheckedChange={async (checked) => {
            await project.update({
              config: {
                createTeamOnSignUp: checked,
              },
            });
          }}
        />
      </SettingCard>

    </PageLayout>
  );
}
