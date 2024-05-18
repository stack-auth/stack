"use client";
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingSwitch } from "@/components/settings";
import Typography from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  return (
    <PageLayout title="Team Settings">
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
        <Typography variant="secondary" type="footnote">
          When enabled, a personal team will be created for each user when they sign up. This will not automatically create teams for existing users.
        </Typography>
      </SettingCard>

    </PageLayout>
  );
}
