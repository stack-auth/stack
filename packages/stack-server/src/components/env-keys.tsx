import { Box, Typography } from "@mui/joy";

export default function EnvKeys(props: {
  projectId: string,
  publishableClientKey?: string,
  secretServerKey?: string,
  superSecretAdminKey?: string,
}) {
  return (
    <Box p={2} bgcolor="background.paper" borderRadius={4} overflow='auto'>
      <Typography>
        NEXT_PUBLIC_STACK_PROJECT_ID={props.projectId}
      </Typography>
      {props.publishableClientKey && <Typography>
        NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY={props.publishableClientKey}
      </Typography>}
      {props.secretServerKey && <Typography>
        STACK_SECRET_SERVER_KEY={props.secretServerKey}
      </Typography>}
      {props.superSecretAdminKey && <Typography>
        STACK_SUPER_SECRET_ADMIN_KEY={props.superSecretAdminKey}
      </Typography>}
    </Box>
  );
}