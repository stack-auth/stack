"use client";

import { Alert } from "@/components/ui/alert";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";
import { SvixProvider, useEndpoints, useSvix } from "svix-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActionCell } from "@/components/data-table/elements/cells";

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

  if (endpoints.error) {
    return <Alert>An error has occurred</Alert>;
  }

  if (endpoints.loading) {
    return <Alert>Loading...</Alert>;
  }

  if (!endpoints.data?.length) {
    return <Alert>No domains added yet.</Alert>;
  }


  return (
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


export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const svixToken = stackAdminApp.useSvixToken();

  return (
    <PageLayout title="Webhooks">
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
