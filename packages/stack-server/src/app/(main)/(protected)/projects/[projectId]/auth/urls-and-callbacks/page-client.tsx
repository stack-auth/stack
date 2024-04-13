"use client";

import { IconButton, List, ListItem, ListDivider, Input, FormControl, FormLabel, Checkbox, Typography, Box, FormHelperText } from "@mui/joy";
import React, { use, useEffect, useState } from "react";
import { Paragraph } from "@/components/paragraph";
import { Icon } from "@/components/icon";
import { Dialog } from "@/components/dialog";
import { AsyncButton } from "@/components/async-button";
import { SimpleCard } from "@/components/simple-card";
import { useAdminApp } from "../../use-admin-app";
import { SmartSwitch } from "@/components/smart-switch";
import { Project } from "@stackframe/stack/dist/lib/stack-app";
import { DomainConfigJson } from "@stackframe/stack-shared/dist/interface/clientInterface";

function isValidUrl(urlString: string) {
  try { 
    return Boolean(new URL(urlString)); 
  }
  catch(e){ 
    return false; 
  }
}

function EditDialog(props: { 
  open: boolean, 
  onClose: () => void,
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
    <Dialog
      title={(props.type === 'create' ? "Create" : "Update") + " domain and handler"}
      open={props.open}
      onClose={() => {
        setNewDomain("");
        setNewDomainError(null);
        props.onClose();
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
    </Dialog>
  );
}

export default function UrlsAndCallbacksClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  const domains = new Set(project.evaluatedConfig.domains);

  const [deleteDialogDomain, setDeleteDialogDomain] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addNewDialogOpen, setAddNewDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | undefined>(undefined);


  return (
    <>
      <SimpleCard title="Domains and Handler">
        <Box sx={{ my: 2 }}>
          <SmartSwitch
            checked={project.evaluatedConfig.allowLocalhost}
            onChange={async (event) => {
              await project.update({
                config: {
                  allowLocalhost: event.target.checked,
                },
              });
            }}
          >
            <Typography>Allow all localhost callbacks for development</Typography>
          </SmartSwitch>
        </Box>

        {domains.size >= 0 && (
          <List
            variant="soft"
            sx={{
              "--List-radius": "9px",
            }}
          >
            {[...domains].map(({ domain, handlerPath }, i) => (
              <React.Fragment key={domain}>
                {i !== 0 && <ListDivider />}
                <ListItem
                  endAction={
                    <>
                      <IconButton
                        aria-label="Edit"
                        size="sm"
                        onClick={() => {
                          setEditIndex(i);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Icon icon="edit" />
                      </IconButton>
                      <IconButton
                        aria-label="Delete"
                        size="sm"
                        color="danger"
                        onClick={() => setDeleteDialogDomain(domain)}
                      >
                        <Icon icon="delete" />
                      </IconButton>
                    </>
                  }
                >
                  <Typography paddingRight={1}>{domain}</Typography>
                  <Typography>{handlerPath}</Typography>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}

        <AsyncButton
          onClick={() => setAddNewDialogOpen(true)}
          variant="soft"
          color="neutral"
          sx={{ mt: 3 }}
        >
          Add new domain
        </AsyncButton>
      </SimpleCard>

      <EditDialog 
        type='create' 
        open={addNewDialogOpen} 
        onClose={() => setAddNewDialogOpen(false)} 
        domains={domains} 
        project={project} 
      />

      <EditDialog 
        type='update' 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        editIndex={editIndex}
        domains={domains}
        project={project}
      />

      <Dialog
        title
        open={deleteDialogDomain !== null}
        onClose={() => setDeleteDialogDomain(null)}
        danger
        okButton={{
          label: "Delete",
          onClick: async () => {
            await project.update({
              config: {
                domains: [...domains].filter(({ domain }) => domain !== deleteDialogDomain),
              }
            });
          }
        }}
        cancelButton
      >
        <Paragraph body sx={{ mt: 0 }}>
          Do you really want to remove <b>{deleteDialogDomain}</b> from the allow list ?
        </Paragraph>
        <Paragraph body sx={{ mb: 0 }}>
          Your project will no longer be able to receive callbacks from this domain.
        </Paragraph>
      </Dialog>
    </>
  );
}
