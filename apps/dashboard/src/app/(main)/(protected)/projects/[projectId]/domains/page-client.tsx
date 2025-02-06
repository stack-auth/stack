"use client";
import { FormDialog } from "@/components/form-dialog";
import { InputField, SwitchField } from "@/components/form-fields";
import { SettingCard, SettingSwitch } from "@/components/settings";
import { AdminDomainConfig, AdminProject } from "@stackframe/stack";
import { createUrlIfValid, isValidUrl } from "@stackframe/stack-shared/dist/utils/urls";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, ActionCell, ActionDialog, Alert, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Typography } from "@stackframe/stack-ui";
import React from "react";
import * as yup from "yup";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";

const DOMAIN_REGEX = /^(((?!-))(xn--|_)?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$/;

function EditDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  trigger?: React.ReactNode,
  domains: AdminDomainConfig[],
  project: AdminProject,
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
    domain: yup.string()
      .matches(DOMAIN_REGEX, "Invalid domain")
      .test('is-domain', (domain) => {
        if (!domain) {
          return true;
        }
        const urlIfValid = createUrlIfValid(`https://${domain}`);
        return !!urlIfValid && urlIfValid.hostname === domain; })
      .notOneOf(
        props.domains
          .filter((_, i) => (props.type === 'update' && i !== props.editIndex) || props.type === 'create')
          .map(({ domain }) => domain),
        "Domain already exists"
      )
      .defined(),
    handlerPath: yup.string()
      .matches(/^\//, "Handler path must start with /")
      .defined(),
    addWww: yup.boolean(),
    allowInsecureHttp: yup.boolean(),
  });

  const canAddWww = (domain: string | undefined) => {
    if (!domain) {
      return false;
    }

    const httpsUrl = 'https://' + domain;
    if (!isValidUrl(httpsUrl)) {
      return false;
    }

    if (domain.startsWith('www.')) {
      return false;
    }

    const wwwUrl = 'https://www.' + domain;
    console.log(wwwUrl, isValidUrl(wwwUrl));
    return isValidUrl(wwwUrl);
  };

  return <FormDialog
    open={props.open}
    defaultValues={{
      addWww: props.type === 'create',
      domain: props.type === 'update' ? props.defaultDomain.replace(/^https:\/\//, "") : undefined,
      handlerPath: props.type === 'update' ? props.defaultHandlerPath : "/handler",
      allowInsecureHttp: false,
    }}
    onOpenChange={props.onOpenChange}
    trigger={props.trigger}
    title={(props.type === 'create' ? "Create" : "Update") + " domain and handler"}
    formSchema={domainFormSchema}
    okButton={{ label: props.type === 'create' ? "Create" : "Save" }}
    onSubmit={async (values) => {
      if (props.type === 'create') {
        await props.project.update({
          config: {
            domains: [
              ...props.domains,
              {
                domain: (values.allowInsecureHttp ? 'http' : 'https') + `://` + values.domain,
                handlerPath: values.handlerPath,
              },
              ...(canAddWww(values.domain) && values.addWww ? [{
                domain: `${values.allowInsecureHttp ? 'http' : 'https'}://www.` + values.domain,
                handlerPath: values.handlerPath,
              }] : []),
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
            })
          },
        });
      }
    }}
    render={(form) => (
      <>
        <Alert>
          Please ensure you own or have control over this domain. Also note that each subdomain (e.g. blog.example.com, app.example.com) is treated as a distinct domain.
        </Alert>
        <InputField
          label="Domain"
          name="domain"
          control={form.control}
          prefixItem={form.getValues('allowInsecureHttp') ? 'http://' : 'https://'}
          placeholder='example.com'
        />

        {props.type === 'create' &&
          canAddWww(form.watch('domain')) && (
          <SwitchField
            label={`Also add www.${form.watch('domain') as any ?? ''} as a trusted domain`}
            name="addWww"
            control={form.control}
          />
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Advanced</AccordionTrigger>
            <AccordionContent>
              <InputField
                label="Handler path"
                name="handlerPath"
                control={form.control}
                placeholder='/handler'
              />
              <Typography variant="secondary" type="footnote">
                only modify this if you changed the default handler path in your app
              </Typography>
              <div className="my-4">
                <SwitchField
                  label="Allow insecure HTTP domains"
                  name="allowInsecureHttp"
                  control={form.control}
                />
              </div>
              <Typography variant="secondary" type="footnote">
                Warning: HTTP domains are insecure and should only be used for development / internal networks.
              </Typography>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </>
    )}
  />;
}

function DeleteDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
  domain: string,
  project: AdminProject,
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
              domains: [...props.project.config.domains].filter(({ domain }) => domain !== props.domain),
            }
          });
        }
      }}
      cancelButton
    >
      <Typography>
        Do you really want to remove <b>{props.domain}</b> from the allow list? Your project will no longer be able to receive callbacks from this domain.
      </Typography>
    </ActionDialog>
  );
}

function ActionMenu(props: {
  domains: AdminDomainConfig[],
  project: AdminProject,
  editIndex: number,
  targetDomain: string,
  defaultHandlerPath: string,
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
      <DeleteDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        domain={props.targetDomain}
        project={props.project}
      />
      <ActionCell
        items={[
          { item: "Edit", onClick: () => setIsEditModalOpen(true) },
          '-',
          { item: "Delete", onClick: () => setIsDeleteModalOpen(true), danger: true }
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
    <PageLayout title="Domains">
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
                  <TableHead>&nbsp;</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map(({ domain, handlerPath }, i) => (
                  <TableRow key={domain}>
                    <TableCell>{domain}</TableCell>
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
          <Alert>
            No domains added yet.
          </Alert>
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
          hint={<>
            When enabled, allow access from all localhost URLs by default. This makes development easier but <b>should be disabled in production.</b>
          </>}
        />
      </SettingCard>
    </PageLayout>
  );
}
