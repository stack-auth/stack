"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SvixProvider, useEndpoints, useSvix } from "svix-react";
import * as yup from "yup";
import { urlSchema } from "@stackframe/stack-shared/dist/schema-fields";
import {
  ActionCell,
  ActionDialog,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Typography,
} from "@stackframe/stack-ui";
import { SmartFormDialog } from "@/components/form-dialog";
import { SettingCard } from "@/components/settings";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";
import { getSvixResult } from "./utils";

type Endpoint = {
  id: string;
  url: string;
  description?: string;
};

function CreateDialog(props: { trigger: React.ReactNode; updateFn: () => void }) {
  const { svix, appId } = useSvix();

  const formSchema = yup.object({
    makeSureAlert: yup.mixed().meta({ stackFormFieldRender: () => <Alert> Make sure this is a trusted URL that you control.</Alert> }),
    url: urlSchema
      .required()
      .label("URL (starts with https://)")
      .test("is-https", "URL must start with https://", (value) => value.startsWith("https://")),
    description: yup.string().label("Description"),
  });

  return (
    <SmartFormDialog
      trigger={props.trigger}
      title={"Create new endpoint"}
      formSchema={formSchema}
      okButton={{ label: "Create" }}
      onSubmit={async (values) => {
        await svix.endpoint.create(appId, { url: values.url, description: values.description });
        props.updateFn();
      }}
    />
  );
}

export function EndpointEditDialog(props: { open: boolean; onClose: () => void; endpoint: Endpoint; updateFn: () => void }) {
  const { svix, appId } = useSvix();

  const formSchema = yup
    .object({
      description: yup.string().label("Description"),
    })
    .default(props.endpoint);

  return (
    <SmartFormDialog
      open={props.open}
      onClose={props.onClose}
      title={"Edit endpoint"}
      formSchema={formSchema}
      okButton={{ label: "Save" }}
      onSubmit={async (values) => {
        await svix.endpoint.update(appId, props.endpoint.id, { url: props.endpoint.url, description: values.description });
        props.updateFn();
      }}
    />
  );
}

function DeleteDialog(props: { open?: boolean; onClose?: () => void; endpoint: Endpoint; updateFn: () => void }) {
  const { svix, appId } = useSvix();
  return (
    <ActionDialog
      open={props.open}
      onClose={props.onClose}
      title="Delete domain"
      danger
      okButton={{
        label: "Delete",
        onClick: async () => {
          await svix.endpoint.delete(appId, props.endpoint.id);
          props.updateFn();
        },
      }}
      cancelButton
    >
      <Typography>
        Do you really want to remove <b>{props.endpoint.url}</b> from the endpoint list? The endpoint will no longer receive events.
      </Typography>
    </ActionDialog>
  );
}

function ActionMenu(props: { endpoint: Endpoint; updateFn: () => void }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const app = useAdminApp();
  const project = app.useProject();

  return (
    <>
      <EndpointEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        endpoint={props.endpoint}
        updateFn={props.updateFn}
      />
      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        endpoint={props.endpoint}
        updateFn={props.updateFn}
      />
      <ActionCell
        items={[
          { item: "View Details", onClick: () => router.push(`/projects/${project.id}/webhooks/${props.endpoint.id}`) },
          { item: "Edit", onClick: () => setEditDialogOpen(true) },
          "-",
          { item: "Delete", onClick: () => setDeleteDialogOpen(true), danger: true },
        ]}
      />
    </>
  );
}

function Endpoints(props: { updateFn: () => void }) {
  const endpoints = getSvixResult(useEndpoints({ limit: 100 }));
  let content = null;

  if (!endpoints.loaded) {
    content = endpoints.rendered;
  } else {
    content = (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[600px]">Endpoint URL</TableHead>
              <TableHead className="w-[300px]">Description</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.data.map((endpoint) => (
              <TableRow key={endpoint.id}>
                <TableCell>{endpoint.url}</TableCell>
                <TableCell>{endpoint.description}</TableCell>
                <TableCell className="flex justify-end gap-4">
                  <ActionMenu endpoint={endpoint} updateFn={props.updateFn} />
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
      actions={<CreateDialog trigger={<Button>Add new endpoint</Button>} updateFn={props.updateFn} />}
    >
      {content}
    </SettingCard>
  );
}

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const svixToken = stackAdminApp.useSvixToken();
  const [updateCounter, setUpdateCounter] = useState(0);

  // This is a hack to make sure svix hooks update when content changes
  const svixTokenUpdated = useMemo(() => {
    return svixToken + "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svixToken, updateCounter]);

  return (
    <PageLayout title="Webhooks" description="Webhooks are used to sync users and teams events from Stack to your own server.">
      <SvixProvider
        token={svixTokenUpdated}
        appId={stackAdminApp.projectId}
        options={{ serverUrl: process.env.NEXT_PUBLIC_STACK_SVIX_SERVER_URL }}
      >
        <Endpoints updateFn={() => setUpdateCounter((x) => x + 1)} />
      </SvixProvider>
    </PageLayout>
  );
}
