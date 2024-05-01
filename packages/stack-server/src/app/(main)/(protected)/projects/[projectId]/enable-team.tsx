import { Paragraph } from "@/components/paragraph";
import { Checkbox, Stack, Switch } from "@mui/joy";
import { useState } from "react";
import { useAdminApp } from "./use-admin-app";
import { SmartSwitch } from "@/components/smart-switch";

export function EnableTeam(props: { children: React.ReactNode }) {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  if (!project.evaluatedConfig.teamsEnabled) {
    return <>
      <Paragraph body>The team feature is currently disabled. A team can have multiple members, and a member can join multiple teams.</Paragraph>
      <Paragraph body>Note that all the users will have a default personal team on signup.</Paragraph>
      <Stack direction="row" alignItems="center" spacing={2}>
        <SmartSwitch
          checked={project.evaluatedConfig.teamsEnabled}
          onChange={async (e) => {
            await project.update({ 
              config: {
                teamsEnabled: e.target.checked
              }
            });
          }}
        />
        <Paragraph body>Enable team</Paragraph>
      </Stack>
    </>;
  } else {
    return <>{props.children}</>;
  }
}