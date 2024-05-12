"use client";

import { IconButton, List, ListItem, ListDivider, Input, FormControl, FormLabel, Box, FormHelperText } from "@mui/joy";
import React, { useEffect, useState } from "react";
import { Paragraph } from "@/components/paragraph";
import { Icon } from "@/components/icon";
import { ActionDialog } from "@/components/action-dialog";
import { Button } from "@/components/ui/button";
import { Project } from "@stackframe/stack";
import { DomainConfigJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { PageLayout } from "../page-layout";
import { SettingCard } from "@/components/setting-card";
import { Switch } from "@/components/ui/switch";
import { useAdminApp } from "../use-admin-app";
import Typography from "@/components/ui/typography";

function isValidUrl(urlString: string) {
  try { 
    return Boolean(new URL(urlString)); 
  }
  catch(e){ 
    return false; 
  }
}

function EditDialog(props: { 
  trigger: React.ReactNode,
  domains: Set<DomainConfigJson>,
  project: Project,
  type: 'update' | 'create',
  editIndex?: number,
}) {
  const [newDomain, setNewDomain] = useState("");
  const [newDomainError, setNewDomainError] = useState<string | null>(null);

  const [newHandlerPath, setNewHandlerPath] = useState("/handler");
  const [newHandlerPathError, setNewHandlerPathError] = useState<string | null>(null);

  useEffect(() => {
    if (props.editIndex !== undefined) {
      const domain = [...props.domains][props.editIndex];
      setNewDomain(domain.domain);
      setNewHandlerPath(domain.handlerPath);
    }
  }, [props.editIndex, props.domains]);

  return (
    <ActionDialog
      trigger={props.trigger}
      title={(props.type === 'create' ? "Create" : "Update") + " domain and handler"}
      onClose={() => {
        setNewDomain("");
        setNewDomainError(null);
      }}
      okButton={{
        label: props.type === 'create' ? "Create" : "Update",
        onClick: async () => {
          if (!newDomain.startsWith("http://") && !newDomain.startsWith("https://")) {
            setNewDomainError("Domain must start with http:// or https://");
            return "prevent-close";
          }
          if (!newHandlerPath.startsWith("/")) {
            setNewHandlerPathError("Handler path must start with /");
            return "prevent-close";
          }
          if (!isValidUrl(newDomain)) {
            setNewDomainError("Invalid domain");
            return "prevent-close";
          }
          if (!isValidUrl(newDomain + newHandlerPath)) {
            setNewHandlerPathError("Invalid handler path");
            return "prevent-close";
          }

          const domainAlreadyExists = [...props.domains].some(({ domain }) => domain === newDomain);
          if (props.type === 'create' && domainAlreadyExists ) {
            setNewDomainError("Domain already exists");
            return "prevent-close";
          }

          if (props.type === 'create') {
            await props.project.update({
              config: {
                domains: [...props.domains, {
                  domain: newDomain,
                  handlerPath: newHandlerPath,
                }],
              },
            });
          } else {
            await props.project.update({
              config: {
                domains: [...props.domains].map((domain, i) => {
                  if (i === props.editIndex) {
                    return {
                      domain: newDomain,
                      handlerPath: newHandlerPath,
                    };
                  }
                  return domain;
                })
              },
            });
          
          }
        }
      }}
      cancelButton
    >
      <Paragraph body>
        <b>Warning:</b> Make sure this is a trusted domain or a URL that you control.
      </Paragraph>

      <FormControl required error={!!newDomainError} sx={{ mt: 2}}>
        <FormLabel>
        Domain (http:// or https://)
        </FormLabel>
        <Input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
        />
        <FormHelperText>
          {newDomainError}
        </FormHelperText>
      </FormControl>

      <FormControl required error={!!newHandlerPathError} sx={{ mt: 2}}>
        <FormLabel>
        Handler path
        </FormLabel>
        <Input
          type="text"
          value={newHandlerPath}
          onChange={(e) => setNewHandlerPath(e.target.value)}
        />
        <FormHelperText>
          {newHandlerPathError}
        </FormHelperText>
      </FormControl>
    </ActionDialog>
  );
}

function DeleteDialog(props: {
  trigger: React.ReactNode,
  domain: string,
  project: Project,
}) {
  return (
    <ActionDialog
      trigger={props.trigger}
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
  const domains = new Set(project.evaluatedConfig.domains);

  return (
    <PageLayout title="Domains and Handler" description="Specify trusted domains and handler URLs">
      <SettingCard 
        title="Domains and Handlers"
        actions={
          <EditDialog
            trigger={<Button>Add new domain</Button>}
            domains={domains}
            project={project}
            type="create"
          />
        }
      >
        <div className="mb-4 flex items-center gap-4">
          <Switch
            checked={project.evaluatedConfig.allowLocalhost}
            onCheckedChange={async (checked) => {
              await project.update({
                config: { allowLocalhost: checked },
              });
            }}
          />
          <Typography>Allow all localhost callbacks for development</Typography>
        </div>

        {domains.size >= 0 && (
          <List
            variant="soft"
            sx={{
              "--List-radius": "9px",
            }}
          >
            {domains.size === 0 && (
              <ListItem>
                <Typography>No handlers added yet. Click the button below to add your first</Typography>
              </ListItem>
            )}
            {[...domains].map(({ domain, handlerPath }, i) => (
              <React.Fragment key={domain}>
                {i !== 0 && <ListDivider />}
                <ListItem
                  endAction={
                    <>
                      <EditDialog
                        trigger={
                          <IconButton aria-label="Edit" size="sm">
                            <Icon icon="edit" />
                          </IconButton>
                        }
                        domains={domains}
                        project={project}
                        type="update"
                        editIndex={i}
                      />
                      <DeleteDialog
                        trigger={
                          <IconButton aria-label="Delete" size="sm" color="danger">
                            <Icon icon="delete" />
                          </IconButton>
                        }
                        domain={domain}
                        project={project}
                      />
                    </>
                  }
                >
                  <Typography>{domain}</Typography>
                  <Typography>{handlerPath}</Typography>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </SettingCard>
    </PageLayout>
  );
}
