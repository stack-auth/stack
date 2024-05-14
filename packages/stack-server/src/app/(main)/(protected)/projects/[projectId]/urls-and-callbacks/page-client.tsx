"use client";;
import * as yup from "yup";
import React, { useMemo } from "react";
import { Paragraph } from "@/components/paragraph";
import { ActionDialog } from "@/components/action-dialog";
import { Button } from "@/components/ui/button";
import { Project } from "@stackframe/stack";
import { DomainConfigJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingSwitch } from "@/components/settings";
import { useAdminApp } from "../use-admin-app";
import { Alert } from "@/components/ui/alert";
import { FormDialog } from "@/components/form-dialog";
import { InputField } from "@/components/form-fields";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActionCell } from "@/components/data-table/elements/cells";

export const domainFormSchema = yup.object({
  domain: yup.string().matches(/^https?:\/\//, "Domain must start with http:// or https://").url("Domain must a valid URL").required(),
  handlerPath: yup.string().matches(/^\//, "Handler path must start with /").required(),
});

function EditDialog(props: { 
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  trigger?: React.ReactNode,
  domains: DomainConfigJson[],
  project: Project,
  type: 'update' | 'create',
  editIndex?: number,
}) {
  const defaultValues = useMemo(() => {
    if (props.editIndex !== undefined) {
      const domain = props.domains[props.editIndex];
      return domain;
    } else {
      return { domain: '', handlerPath: '/handler' };
    }
  }, [props.editIndex, props.domains]);

  const domainFormSchema = yup.object({
    domain: yup.string()
      .matches(/^https?:\/\//, "Domain must start with http:// or https://")
      .url("Domain must a valid URL")
      .notOneOf(props.domains
        .filter((_, i) => i !== props.editIndex)
        .map(({ domain }) => domain), "Domain already exists")
      .required(),
    handlerPath: yup.string()
      .matches(/^\//, "Handler path must start with /")
      .required(),
  });

  return <FormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    trigger={props.trigger}
    title={(props.type === 'create' ? "Create" : "Update") + " domain and handler"}
    defaultValues={defaultValues}
    formSchema={domainFormSchema}
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
    render={(form) => (
      <>
        <Alert>
          Make sure this is a trusted domain or a URL that you control.
        </Alert>

        <InputField
          control={form.control}
          name="domain"
          label="Domain (http:// or https://)"
          placeholder="https://example.com"
          required
        />
          
        <InputField
          control={form.control}
          name="handlerPath"
          label="Handler path"
          placeholder="/handler"
          required
        />
      </>
    )}
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
      <Paragraph body sx={{ mt: 0 }}>
        Do you really want to remove <b>{props.domain}</b> from the allow list ?
      </Paragraph>
      <Paragraph body sx={{ mb: 0 }}>
        Your project will no longer be able to receive callbacks from this domain.
      </Paragraph>
    </ActionDialog>
  );
}

export default function UrlsAndCallbacksClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();
  const domains = project.evaluatedConfig.domains;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  return (
    <PageLayout title="Domains and Handler" description="Callback URLs that are allowed to send requests to your project">
      <SettingCard 
        title="Domains and Handlers"
        description="Trusted domains of your app and their handler paths"
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

      <SettingCard title="Development settings" description="Help you to have a better development experience">
        <SettingSwitch
          checked={project.evaluatedConfig.allowLocalhost}
          onCheckedChange={async (checked) => {
            await project.update({
              config: { allowLocalhost: checked },
            });
          }}
          label="Allow all localhost callbacks for development"
        />
      </SettingCard>
    </PageLayout>
  );
}
