"use client";

import { CopyButton } from "@/components/copy-button";
import { SettingCard } from "@/components/settings";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Typography from "@/components/ui/typography";
import { useMemo, useState } from "react";
import { SvixProvider, useEndpoint, useEndpointMessageAttempts, useEndpointSecret } from "svix-react";
import { PageLayout } from "../../page-layout";
import { useAdminApp } from "../../use-admin-app";

const statusToString = {
  0: "Success",
  1: "Pending",
  2: "Fail",
  3: "Sending",
};

function PageInner(props: { endpointId: string }) {
  const endpoint = useEndpoint(props.endpointId);
  const secret = useEndpointSecret(props.endpointId);

  if (endpoint.loading || secret.loading) {
    throw new Promise(() => undefined);
  }

  if (endpoint.error || !endpoint.data || secret.error || !secret.data) {
    return <Alert>An error has occurred</Alert>;
  }

  return (
    <PageLayout title="Webhook Endpoint" description={endpoint.data.url}>
      <SettingCard title="Endpoint Details">
        <div>
          <Label>URL</Label>
          <Typography>{endpoint.data.url}</Typography>
        </div>
        <div>
          <Label>Description</Label>
          <Typography>{endpoint.data.description || "No description"}</Typography>
        </div>
        <div>
          <Label>Verification secret</Label>
          <div className="flex items-center space-x-2">
            <Typography type='label'> {secret.data.key}</Typography>
            <CopyButton content={secret.data.key} />
          </div>
        </div>
      </SettingCard>

      <SettingCard title="Events History" description="The log of events sent to this endpoint">
        <MessageTable endpointId={props.endpointId} />
      </SettingCard>
    </PageLayout>
  );
}

function MessageTable(props: { endpointId: string }) {
  const messages = useEndpointMessageAttempts(props.endpointId);

  if (messages.loading) {
    throw new Promise(() => undefined);
  }

  if (messages.error || !messages.data) {
    return <Alert>An error has occurred</Alert>;
  }

  if (messages.data.length === 0) {
    return <Alert>No events sent</Alert>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">ID</TableHead>
            <TableHead className="w-[100px]">Message</TableHead>
            <TableHead className="w-[300px]">Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.data.map(message => (
            <TableRow key={message.id}>
              <TableCell>{message.id}</TableCell>
              <TableCell><Badge variant={'secondary'}>{statusToString[message.status]}</Badge></TableCell>
              <TableCell>{message.timestamp.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function PageClient(props: { endpointId: string }) {
  const stackAdminApp = useAdminApp();
  const svixToken = stackAdminApp.useSvixToken();
  const [updateCounter, setUpdateCounter] = useState(0);

  // This is a hack to make sure svix hooks update when content changes
  const svixTokenUpdated = useMemo(() => {
    return svixToken + '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svixToken, updateCounter]);

  return (
    <SvixProvider
      token={svixTokenUpdated}
      appId={stackAdminApp.projectId}
      options={{ serverUrl: process.env.NEXT_PUBLIC_STACK_SVIX_SERVER_URL }}
    >
      <PageInner endpointId={props.endpointId} />
    </SvixProvider>
  );
}
