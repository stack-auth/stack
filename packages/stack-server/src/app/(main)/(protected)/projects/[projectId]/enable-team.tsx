import { Paragraph } from "@/components/paragraph";
import { Checkbox, Stack, Switch } from "@mui/joy";
import { useState } from "react";

export function EnableTeam(props: { children: React.ReactNode }) {
  const [state, setState] = useState(false);

  if (!state) {
    return <>
      <Paragraph body>The team feature is currently disabled. A team can have multiple members, and a member can join multiple teams.</Paragraph>
      <Paragraph body>Note that all the users will have a default personal team on signup.</Paragraph>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Switch
          checked={state}
          onChange={(e) => setState(e.target.checked)}
        />
        <Paragraph body>Enable team</Paragraph>
      </Stack>
    </>;
  } else {
    return <>{props.children}</>;
  }
}