"use client";;
import { Typography } from "@mui/joy";
import { Paragraph } from "@/components/paragraph";
import { SmartSwitch } from "@/components/smart-switch";
import { SimpleCard } from "@/components/simple-card";
import { useAdminApp } from "../use-admin-app";

export default function TeamSettingsClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  return (
    <>
      <Paragraph h1>
        Environment
      </Paragraph>


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
    </>
  );
}
