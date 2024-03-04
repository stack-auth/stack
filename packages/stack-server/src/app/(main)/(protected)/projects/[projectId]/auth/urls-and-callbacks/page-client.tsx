"use client";

import { IconButton, List, ListItem, ListDivider, Input, FormControl, FormLabel } from "@mui/joy";
import React, { use, useState } from "react";
import { Paragraph } from "@/components/paragraph";
import { Icon } from "@/components/icon";
import { Dialog } from "@/components/dialog";
import { AsyncButton } from "@/components/async-button";
import { useStrictMemo } from "@stackframe/stack-shared/src/hooks/use-strict-memo";
import { SimpleCard } from "@/components/simple-card";
import { useAdminApp } from "../../useAdminInterface";

export default function UrlsAndCallbacksClient() {
  const stackAdminApp = useAdminApp();

  const [invalidationCounter, setInvalidationCounter] = useState(0);
  const projectPromise = useStrictMemo(async () => {
    return await stackAdminApp.getProject();
  }, [stackAdminApp, invalidationCounter]);
  const project = use(projectPromise);
  const domains = new Set(project.evaluatedConfig.domains);

  const [deleteDialogPrefix, setDeleteDialogDomain] = useState<string | null>(null);

  const [addNewDialogOpen, setAddNewDialogOpen] = useState(false);

  const [newDomain, setNewDomain] = useState("");
  const [newDomainError, setNewDomainError] = useState(false);

  const [newHandlerPath, setNewHandlerPath] = useState("/handler");
  const [newHandlerPathError, setNewHandlerPathError] = useState(false);

  return (
    <>
      <Paragraph h1>
        Domains and Handler
      </Paragraph>

      <SimpleCard title="Allowed Oauth callback URLs">
        <Paragraph sidenote sx={{ mt: 0 }}>
          Please put in a list of your domains that you control and run the handler on.
        </Paragraph>

        <List
          variant="soft"
          sx={{
            "--List-radius": "9px"
          }}
        >
          {[...domains].map(({ domain }, i) => (
            <React.Fragment key={domain}>
              {i !== 0 && <ListDivider />}
              <ListItem
                endAction={
                  <IconButton
                    aria-label="Delete"
                    size="sm"
                    color="danger"
                    onClick={() => setDeleteDialogDomain(domain)}
                  >
                    <Icon icon="delete" />
                  </IconButton>
                }
              >
                {domain}
              </ListItem>
            </React.Fragment>
          ))}
        </List>
        <AsyncButton
          onClick={() => setAddNewDialogOpen(true)}
          variant="plain"
          color="neutral"
        >
          Add new prefix
        </AsyncButton>
      </SimpleCard>

      <Dialog
        title
        open={deleteDialogPrefix !== null}
        onClose={() => setDeleteDialogDomain(null)}
        danger
        okButton={{
          label: "Delete",
          onClick: async () => {
            await stackAdminApp.updateProject({
              config: {
                domains: [...domains].filter(({ domain }) => domain !== deleteDialogPrefix),
              }
            });
            setInvalidationCounter(invalidationCounter + 1);
          }
        }}
        cancelButton
      >
        <Paragraph body sx={{ mt: 0 }}>
          Do you really want to delete the callback prefix <b>{deleteDialogPrefix}</b>?
        </Paragraph>
        <Paragraph body sx={{ mb: 0 }}>
          All callback URLs that start with this prefix will be disallowed.
        </Paragraph>
      </Dialog>

      <Dialog
        title="Add new prefix"
        open={addNewDialogOpen}
        onClose={() => {
          setAddNewDialogOpen(false);
          setNewDomain("");
          setNewDomainError(false);
        }}
        okButton={{
          label: "Add",
          onClick: async () => {
            if (!newDomain.startsWith("http://") && !newDomain.startsWith("https://")) {
              setNewDomainError(true);
              return "prevent-close";
            }
            await stackAdminApp.updateProject({
              config: {
                domains: [...domains, {
                  domain: newDomain,
                  handlerPath: newHandlerPath,
                }],
              },
            });
            setInvalidationCounter(invalidationCounter + 1);
          }
        }}
        cancelButton
      >
        <Paragraph body>
          <b>Warning:</b> Make sure this is a trusted domain or a URL that you control.
        </Paragraph>

        <FormControl required error={newDomainError} sx={{ mt: 2}}>
          <FormLabel>
            Domain (http:// or https://)
          </FormLabel>
          <Input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
          />
        </FormControl>

        <FormControl required error={newHandlerPathError} sx={{ mt: 2}}>
          <FormLabel>
            Handler path
          </FormLabel>
          <Input
            type="text"
            value={newHandlerPath}
            onChange={(e) => setNewHandlerPath(e.target.value)}
          />
        </FormControl>
      </Dialog>
    </>
  );
}
