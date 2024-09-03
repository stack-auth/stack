import { Button, CopyField, Tabs, TabsContent, TabsList, TabsTrigger } from "@stackframe/stack-ui";

export default function EnvKeys(props: {
  projectId: string;
  publishableClientKey?: string;
  secretServerKey?: string;
  superSecretAdminKey?: string;
}) {
  const handleDownloadKeys = () => {
    const content = Object.entries({
      NEXT_PUBLIC_STACK_PROJECT_ID: props.projectId,
      NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: props.publishableClientKey,
      STACK_SECRET_SERVER_KEY: props.secretServerKey,
      STACK_SUPER_SECRET_ADMIN_KEY: props.superSecretAdminKey,
    })
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `api_keys.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Tabs defaultValue={"env"}>
      <TabsList className="flex">
        <TabsTrigger value="env" className="flex-grow">
          Next.js
        </TabsTrigger>
        <TabsTrigger value="keys" className="flex-grow">
          API Keys
        </TabsTrigger>
      </TabsList>
      <TabsContent value={"env"}>
        <CopyField
          monospace
          height={160}
          value={Object.entries({
            NEXT_PUBLIC_STACK_PROJECT_ID: props.projectId,
            NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: props.publishableClientKey,
            STACK_SECRET_SERVER_KEY: props.secretServerKey,
            STACK_SUPER_SECRET_ADMIN_KEY: props.superSecretAdminKey,
          })
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}=${v}`)
            .join("\n")}
          label="Next.js Environment variables"
        />
      </TabsContent>
      <TabsContent value={"keys"}>
        <div className="flex flex-col gap-2">
          {props.projectId && (
            <CopyField
              monospace
              value={props.projectId}
              label="Project ID"
              helper="This ID is used in your client-side code and is safe to expose to the public."
            />
          )}
          {props.publishableClientKey && (
            <CopyField
              monospace
              value={props.publishableClientKey}
              label="Publishable Client Key"
              helper="This key is used in your client-side code and is safe to expose to the public."
            />
          )}
          {props.secretServerKey && (
            <CopyField
              monospace
              value={props.secretServerKey}
              label="Secret Server Key"
              helper="This key is used on the server-side and can be used to perform actions on behalf of your users. Keep it safe."
            />
          )}
          {props.superSecretAdminKey && (
            <CopyField
              monospace
              value={props.superSecretAdminKey}
              label="Super Secret Admin Key"
              helper="This key is for administrative use only. Anyone owning this key will be able to create unlimited new keys and revoke any other keys. Be careful!"
            />
          )}
        </div>
      </TabsContent>
      <Button variant="secondary" className="mt-1.5 w-full" onClick={handleDownloadKeys}>
        Download Keys
      </Button>
    </Tabs>
  );
}
