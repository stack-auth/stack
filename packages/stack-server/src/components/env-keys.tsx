import { Box, FormControl, FormHelperText, FormLabel, Input, Stack, Tab, TabList, TabPanel, Tabs, Textarea, Typography } from "@mui/joy";
import { CopyButton } from "./copy-button";
import { InlineCode } from "./inline-code";
import { deindent } from "@stackframe/stack-shared/dist/utils/strings";

export default function EnvKeys(props: {
  projectId: string,
  publishableClientKey?: string,
  secretServerKey?: string,
  superSecretAdminKey?: string,
}) {
  return (
    <Tabs>
      <TabList>
        <Tab>Next.js</Tab>
        <Tab>API Keys</Tab>
      </TabList>
      <TabPanel value={0}>
        <CopyField
          value={Object.entries({
            NEXT_PUBLIC_STACK_PROJECT_ID: props.projectId,
            NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: props.publishableClientKey,
            STACK_SECRET_SERVER_KEY: props.secretServerKey,
            STACK_SUPER_SECRET_ADMIN_KEY: props.superSecretAdminKey,
          }).filter(([k, v]) => v).map(([k, v]) => `${k}=${v}`).join("\n")}
          label="Environment variables"
          helper={<>Copy these variables into your <InlineCode>.env.local</InlineCode> file.</>}
        />
      </TabPanel>
      <TabPanel value={1}>
        <Stack spacing={1}>
          {props.publishableClientKey && (
            <CopyField
              value={props.publishableClientKey}
              label="Publishable client key"
              helper="You will use this key in your client-side code. It's safe to expose it to the public."
            />
          )}
          {props.secretServerKey && (
            <CopyField
              value={props.secretServerKey}
              label="Secret server key"
              helper="You will use this key in your server-side code. It can be used to perform actions on behalf of your users, so keep it safe."
            />
          )}
          {props.superSecretAdminKey && (
            <CopyField
              value={props.superSecretAdminKey}
              label="Super secret admin key"
              helper={<>This key is for administrative use only. Anyone owning this key will be able to create unlimited new keys and revoke any other keys. <Typography fontWeight="bold">Be careful!</Typography></>}
            />
          )}
        </Stack>
      </TabPanel>
    </Tabs>
  );
}


function CopyField(props: { value: string, label?: React.ReactNode, helper?: React.ReactNode }) {
  return (
    <FormControl>
      {props.label && (
        <FormLabel>
          {props.label}
        </FormLabel>
      )}
      <Box position="relative">
        <Textarea
          readOnly
          value={props.value}
          sx={{
            paddingRight: 2,
          }}
        />
        <CopyButton content={props.value} size="sm" sx={{ position: "absolute", right: 2, top: 2 }} />
      </Box>
      {props.helper && (
        <FormHelperText>
          {props.helper}
        </FormHelperText>
      )}
    </FormControl>
  );
}
