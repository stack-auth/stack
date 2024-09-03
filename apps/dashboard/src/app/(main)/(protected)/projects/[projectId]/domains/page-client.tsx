"use client";

import React from "react";
import * as yup from "yup";
import { AdminDomainConfig, AdminProject } from "@stackframe/stack";
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
import { SettingCard, SettingSwitch } from "@/components/settings";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";

function EditDialog(
  props: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    domains: AdminDomainConfig[];
    project: AdminProject;
    type: "update" | "create";
  } & (
    | {
        type: "create";
      }
    | {
        type: "update";
        editIndex: number;
        defaultDomain: string;
        defaultHandlerPath: string;
      }
  ),
) {
  const domainFormSchema = yup.object({
    makeSureAlert: yup.mixed().meta({
      stackFormFieldRender: () => <Alert>Make sure this is a trusted domain or a URL that you control.</Alert>,
    }),
    domain: urlSchema
      .matches(/^https:\/\//, "Origin must start with https://")
      .url("Domain must be a valid URL")
      .notOneOf(
        props.domains
          .filter((_, i) => (props.type === "update" && i !== props.editIndex) || props.type === "create")
          .map(({ domain }) => domain),
        "Domain already exists",
      )
      .required()
      .label("Origin (starts with https://)")
      .meta({
        stackFormFieldPlaceholder: "https://example.com",
      })
      .default(props.type === "update" ? props.defaultDomain : ""),
    handlerPath: yup
      .string()
      .matches(/^\//, "Handler path must start with /")
      .required()
      .label("Handler path (default: /handler)")
      .default(props.type === "update" ? props.defaultHandlerPath : "/handler"),
    description: yup.mixed().meta({
      stackFormFieldRender: () => (
        <>
          <Typography variant="secondary" type="footnote">
            Note that sub-domains are not automatically added. Create two domains like www.example.com and example.com if you want to allow
            both.
          </Typography>
          <Typography variant="secondary" type="footnote">
            {"You don't need to change the handler path unless you updated the path to the StackHandler."}
          </Typography>
        </>
      ),
    }),
  });

  return (
    <SmartFormDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      trigger={props.trigger}
      title={(props.type === "create" ? "Create" : "Update") + " domain and handler"}
      formSchema={domainFormSchema}
      okButton={{ label: props.type === "create" ? "Create" : "Save" }}
      onSubmit={async (values) => {
        if (props.type === "create") {
          await props.project.update({
            config: {
              domains: [
                ...props.domains,
                {
                  domain: values.domain,
                  handlerPath: values.handlerPath,
                },
              ],
            },
          });
        } else {
          await props.project.update({
            config: {
              domains: [...props.domains].map((domain, i) => {
                if (i === props.editIndex) {
                  return {
                    domain: values.domain,
                    handlerPath: values.handlerPath,
                  };
                }
                return domain;
              }),
            },
          });
        }
      }}
    />
  );
}

function DeleteDialog(props: { open?: boolean; onOpenChange?: (open: boolean) => void; domain: string; project: AdminProject }) {
  return (
    <ActionDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="Delete domain"
      danger
      okButton={{
        label: "Delete",
        onClick: async () => {
          await props.project.update({
            config: {
              domains: [...props.project.config.domains].filter(({ domain }) => domain !== props.domain),
            },
          });
        },
      }}
      cancelButton
    >
      <Typography>
        Do you really want to remove <b>{props.domain}</b> from the allow list? Your project will no longer be able to receive callbacks
        from this domain.
      </Typography>
    </ActionDialog>
  );
}

function ActionMenu(props: {
  domains: AdminDomainConfig[];
  project: AdminProject;
  editIndex: number;
  targetDomain: string;
  defaultHandlerPath: string;
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  return (
    <>
      <EditDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        domains={props.domains}
        project={props.project}
        type="update"
        editIndex={props.editIndex}
        defaultDomain={props.targetDomain}
        defaultHandlerPath={props.defaultHandlerPath}
      />
      <DeleteDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} domain={props.targetDomain} project={props.project} />
      <ActionCell
        items={[
          { item: "Edit", onClick: () => setIsEditModalOpen(true) },
          "-",
          { item: "Delete", onClick: () => setIsDeleteModalOpen(true), danger: true },
        ]}
      />
    </>
  );
}

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProject();
  const domains = project.config.domains;

  return (
    <PageLayout title="Domains and Handler">
      <SettingCard
        title="Trusted domains"
        description="Features that will redirect to your app, such as SSO and e-mail verification, will refuse to redirect to domains other than the ones listed here. Please make sure that you trust all domains listed here, as they can be used to access user data."
        actions={<EditDialog trigger={<Button>Add new domain</Button>} domains={domains} project={project} type="create" />}
      >
        {domains.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Domain</TableHead>
                  <TableHead className="w-[100px]">Handler</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map(({ domain, handlerPath }, i) => (
                  <TableRow key={domain}>
                    <TableCell>{domain}</TableCell>
                    <TableCell>{handlerPath}</TableCell>
                    <TableCell className="flex justify-end gap-4">
                      <ActionMenu
                        domains={domains}
                        project={project}
                        editIndex={i}
                        targetDomain={domain}
                        defaultHandlerPath={handlerPath}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Alert>No domains added yet.</Alert>
        )}
      </SettingCard>

      <SettingCard title="Development settings">
        <SettingSwitch
          checked={project.config.allowLocalhost}
          onCheckedChange={async (checked) => {
            await project.update({
              config: { allowLocalhost: checked },
            });
          }}
          label="Allow all localhost callbacks for development"
          hint={
            <>
              When enabled, allow access from all localhost URLs by default. This makes development easier but{" "}
              <b>should be disabled in production.</b>
            </>
          }
        />
      </SettingCard>
    </PageLayout>
  );
}
