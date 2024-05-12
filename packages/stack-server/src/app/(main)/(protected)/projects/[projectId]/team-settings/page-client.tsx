"use client";;
import { Typography } from "@mui/joy";
import { Paragraph } from "@/components/paragraph";
import { SmartSwitch } from "@/components/smart-switch";
import { SimpleCard } from "@/components/simple-card";
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";

export default function TeamSettingsClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  return (
    <PageLayout title="Team Settings" description="Configure how teams are created and managed">
      <SimpleCard title="Automatic Team Creation">
        <SmartSwitch
          checked={project.evaluatedConfig.createTeamOnSignUp}
          size="lg"
          onChange={async (event) => {
            await project.update({
              config: {
                createTeamOnSignUp: event.target.checked,
              },
            });
          }}
        >
          <Typography>
            {`Create a personal team for each user on sign-up`}
          </Typography>
        </SmartSwitch>
      </SimpleCard>
    </PageLayout>
  );
}
