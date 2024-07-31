"use client";

import { CopyButton } from "@/components/copy-button";
import { SettingCard, SettingSwitch } from "@/components/settings";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Typography from "@/components/ui/typography";
import { useMemo, useState } from "react";
import { SvixProvider, useEndpoint, useEndpointFunctions, useEndpointMessageAttempts, useEndpointSecret } from "svix-react";
import { PageLayout } from "../../page-layout";
import { useAdminApp } from "../../use-admin-app";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SiteLoadingIndicator } from "@/components/site-loading-indicator";
import { StackAssertionError, captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { getSvixResult } from "../utils";

const statusToString = {
  0: "Success",
  1: "Pending",
  2: "Fail",
  3: "Sending",
};

function PageInner(props: { endpointId: string }) {
  const endpoint = getSvixResult(useEndpoint(props.endpointId));

  if (!endpoint.loaded) return endpoint.rendered;


  return (
    <PageLayout title="Webhook Endpoint" description={endpoint.data.url}>
      <SettingCard title="Details" description="The details of this endpoint">
        <EndpointDetails endpointId={props.endpointId} />
      </SettingCard>

      <SettingCard title="Filters" description="Only receive certain events">
        <FilterEvents endpointId={props.endpointId} />
      </SettingCard>

      <SettingCard title="Events History" description="The log of events sent to this endpoint">
        <MessageTable endpointId={props.endpointId} />
      </SettingCard>
    </PageLayout>
  );
}

function EndpointDetails(props: { endpointId: string }) {
  const endpoint = getSvixResult(useEndpoint(props.endpointId));
  const secret = getSvixResult(useEndpointSecret(props.endpointId));

  if (!endpoint.loaded) return endpoint.rendered;
  if (!secret.loaded) return secret.rendered;

  return (
    <>
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
    </>
  );
}

function FilterEvents(props: { endpointId: string }) {
  const endpoint = getSvixResult(useEndpoint(props.endpointId));
  const { updateEndpoint } = useEndpointFunctions(props.endpointId);

  if (!endpoint.loaded) return endpoint.rendered;

  const filterTypes = endpoint.data.filterTypes;

  return (
    <>
      <SettingSwitch
        label="Enable filtering"
        checked={!!filterTypes?.length}
        onCheckedChange={async (checked) => {
          // await updateEndpoint({ filterTypes: checked ? ['*'] : [] });
        }}
      />
    </>
  );
}


function MessageTable(props: { endpointId: string }) {
  const messages = getSvixResult(useEndpointMessageAttempts(props.endpointId, { limit: 10 }));

  if (!messages.loaded) return messages.rendered;

  if (messages.data.length === 0) {
    return <Alert>No events sent</Alert>;
  }

  return (
    <div className="flex flex-col gap-4">
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

      <div className="flex justify-end gap-4">
        <Button size='icon' variant={'outline'} disabled={!messages.hasPrevPage} onClick={messages.prevPage}>
          <ChevronLeft />
        </Button>

        <Button size='icon' variant={'outline'} disabled={!messages.hasNextPage} onClick={messages.nextPage}>
          <ChevronRight />
        </Button>
      </div>
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
