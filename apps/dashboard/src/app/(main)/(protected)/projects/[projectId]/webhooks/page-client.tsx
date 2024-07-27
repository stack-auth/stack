"use client";

import { Alert } from "@/components/ui/alert";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";
import { SvixProvider, useEndpoints, useSvix } from "svix-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActionCell } from "@/components/data-table/elements/cells";
import { SettingCard } from "@/components/settings";
import { Button } from "@/components/ui/button";

function ActionMenu() {
  return (
    <>
      <ActionCell
        items={[
          { item: "Edit", onClick: () => {} },
          '-',
          { item: "Delete", onClick: () => {}, danger: true }
        ]}
      />
    </>
  );
}

function Endpoints() {
  const endpoints = useEndpoints();
  const svix = useSvix();
  let content = null;

  if (endpoints.error) {
    content = <Alert>An error has occurred</Alert>;
  }

  if (endpoints.loading) {
    content = <Alert>Loading...</Alert>;
  }

  if (!endpoints.data?.length) {
    content = <Alert>No domains added yet.</Alert>;
  } else {
    content = (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[600px]">Endpoint URL</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.data.map(endpoint => (
              <TableRow key={endpoint.id}>
                <TableCell>{endpoint.url}</TableCell>
                <TableCell className="flex justify-end gap-4">
                  <ActionMenu />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <SettingCard
      title="Endpoints"
      description="Endpoints are the URLs that we will send events to. Please make sure you control these endpoints, as they can receive sensitive data."
      actions={<Button>Add new endpoint</Button>}
      // actions={
      //   <EditDialog
      //     trigger={<Button>Add new domain</Button>}
      //     domains={domains}
      //     project={project}
      //     type="create"
      //   />
      // }
    >
      {content}
    </SettingCard>
  );
}


export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const svixToken = stackAdminApp.useSvixToken();

  return (
    <PageLayout
      title="Webhooks"
      description="Webhooks are used to sync users and teams events from Stack to your own server."
    >
      <SvixProvider
        token={svixToken}
        appId={stackAdminApp.projectId}
        options={{ serverUrl: process.env.NEXT_PUBLIC_STACK_SVIX_SERVER_URL }}
      >
        <Endpoints />
      </SvixProvider>
    </PageLayout>
  );
}
