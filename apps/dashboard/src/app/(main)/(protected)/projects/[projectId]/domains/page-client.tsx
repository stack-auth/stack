"use client";
import * as yup from "yup";
import React, { useMemo } from "react";
import { ActionDialog } from "@/components/action-dialog";
import { Button } from "@/components/ui/button";
import { Project } from "@stackframe/stack";
import { DomainConfigJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingSwitch } from "@/components/settings";
import { useAdminApp } from "../use-admin-app";
import { Alert } from "@/components/ui/alert";
import { SmartFormDialog } from "@/components/form-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActionCell } from "@/components/data-table/elements/cells";
import Typography from "@/components/ui/typography";

function EditDialog(props: { 
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  trigger?: React.ReactNode,
  domains: DomainConfigJson[],
  project: Project,
  type: 'update' | 'create',
} & (
  { 
    type: 'create', 
  } | 
  { 
    type: 'update', 
    editIndex: number, 
    defaultDomain: string,
    defaultHandlerPath: string,
  }
)) {
  const domainFormSchema = yup.object({
    makeSureAlert: yup.mixed().meta({
      stackFormFieldRender: () => (
        <Alert>
          Make sure this is a trusted domain or a URL that you control.
        </Alert>
      ),
    }),
    domain: yup.string()
      .matches(/^https?:\/\//, "Origin must start with http:// or https://")
      .url("Domain must be a valid URL")
      .notOneOf(props.domains
        .filter((_, i) => props.type === 'update' && i !== props.editIndex)
        .map(({ domain }) => domain), "Domain already exists")
      .required()
      .label("Origin (protocol + domain)")
      .meta({
        stackFormFieldPlaceholder: "https://example.com",
      }).default(props.type === 'update' ? props.defaultDomain : ""),
    handlerPath: yup.string()
      .matches(/^\//, "Handler path must start with /")
      .required()
      .label("Handler path")
      .default(props.type === 'update' ? props.defaultHandlerPath : "/handler"),
  });

  return <SmartFormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    trigger={props.trigger}
    title={(props.type === 'create' ? "Create" : "Update") + " domain and handler"}
    formSchema={domainFormSchema}
    okButton={{ label: props.type === 'create' ? "Create" : "Save" }}
    onSubmit={async (values) => {
      if (props.type === 'create') {
        await props.project.update({
          config: {
            domains: [...props.domains, {
              domain: values.domain,
              handlerPath: values.handlerPath,
            }],
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
            })
          },
        });
      }
    }}
  />;
}

function DeleteDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  domain: string,
  project: Project,
}) {
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
              domains: [...props.project.evaluatedConfig.domains].filter(({ domain }) => domain !== props.domain),
            }
          });
        }
      }}
      cancelButton
    >
      <Typography>
        Do you really want to remove <b>{props.domain}</b> from the allow list ?
      </Typography>
      <Typography>
        Your project will no longer be able to receive callbacks from this domain.
      </Typography>
    </ActionDialog>
  );
}

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();
  const domains = project.evaluatedConfig.domains;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  return (
    <PageLayout title="Domains and Handler">
      <SettingCard 
        title="Trusted domains"
        description="Features that will redirect to your app, such as SSO and e-mail verification, will refuse to redirect to domains other than the ones listed here. Please make sure that you trust all domains listed here, as they can be used to access user data."
        actions={
          <EditDialog
            trigger={<Button>Add new domain</Button>}
            domains={domains}
            project={project}
            type="create"
          />
        }
      >
        {domains.length > 0 ? (
          <div className="border rounded-md">
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
                      <EditDialog
                        open={isEditModalOpen}
                        onOpenChange={setIsEditModalOpen}
                        domains={domains}
                        project={project}
                        type="update"
                        editIndex={i}
                        defaultDomain={domain}
                        defaultHandlerPath={handlerPath}
                      />
                      <DeleteDialog
                        open={isDeleteModalOpen}
                        onOpenChange={setIsDeleteModalOpen}
                        domain={domain}
                        project={project}
                      />
                      <ActionCell 
                        items={[{ item: "Edit", onClick: () => setIsEditModalOpen(true) }]}
                        dangerItems={[{ item: "Delete", onClick: () => setIsDeleteModalOpen(true) }]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Alert>
            No domains added yet.
          </Alert>
        )}
      </SettingCard>

      <SettingCard title="Development settings">
        <SettingSwitch
          checked={project.evaluatedConfig.allowLocalhost}
          onCheckedChange={async (checked) => {
            await project.update({
              config: { allowLocalhost: checked },
            });
          }}
          label="Allow all localhost callbacks for development"
        />

        
        <Typography variant="secondary" type="footnote">
          When enabled, allow access from all localhost URLs by default. This makes development easier but <b>should be disabled in production.</b>
        </Typography>
      </SettingCard>
    </PageLayout>
  );
}
