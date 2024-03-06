"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Select,
  Option,
  Box,
  Stack,
  BoxProps,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Typography,
  Modal,
  ModalDialog,
  DialogTitle,
  Divider,
  Checkbox,
  DialogActions,
} from "@mui/joy";
import { OauthProviderConfigJson } from "@stackframe/stack-shared";
import { useEffect, useMemo, useState } from "react";
import { Paragraph } from "@/components/paragraph";
import { AsyncButton } from "@/components/async-button";
import { SharedProvider, StandardProvider, sharedProviders, standardProviders, toSharedProvider, toStandardProvider } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { useAdminApp } from "../../use-admin-app";
import { SmartSwitch } from "@/components/smart-switch";
import { Dialog } from "@/components/dialog";
import { DialogContent, Icon } from "@mui/material";

/**
 * All the different types of Oauth providers that can be created.
 */
export const availableProviders = standardProviders;
export type ProviderType = typeof availableProviders[number];

type Props = {
  id: ProviderType,
  provider?: OauthProviderConfigJson,
  updateProvider: (provider: OauthProviderConfigJson) => Promise<void>,
};

function toTitle(id: ProviderType) {
  return {
    github: "GitHub",
    google: "Google",
    facebook: "Facebook",
    microsoft: "Microsoft",
  }[id] ?? `Custom Oauth provider: ${id}`;
}

function ConfirmDialog(props: { open: boolean, onClose(): void, onConfirm(): Promise<void> }) {
  const [confirmed, setConfirmedOnlyOnce] = useState(false);

  return (
    <Modal open={props.open} onClose={props.onClose}>
      <ModalDialog minWidth="60vw">
        <DialogTitle>
          Danger! Are you sure?
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} overflow='hidden'>
            <Paragraph body>
              Disabling this provider will prevent users from signing in with it, including existing users who have used it before. They might not be able to log in anymore. Are you sure you want to do this?
            </Paragraph>
            <Checkbox
              label="I understand that this will disable sign-in and sign-up for new and existing users with this provider"
              checked={confirmed}
              onChange={() => setConfirmedOnlyOnce(!confirmed)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <AsyncButton
            color="primary"
            onClick={async () => {
              await props.onConfirm();
              props.onClose();
            }}
            disabled={!confirmed}
          >
            Disable Provider
          </AsyncButton>
          <AsyncButton
            color="neutral"
            onClick={() => props.onClose()}
          >
            Cancel
          </AsyncButton>
        </DialogActions>
      </ModalDialog>
    </Modal>
  );
}

function AccordionSummaryContent(props: Props) {
  const title = toTitle(props.id);
  const enabled = props.provider?.enabled;
  const [checked, setChecked] = useState(enabled);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const updateProvider = async (options: { enabled: boolean, id: ProviderType }) => {
    if (props.provider) {
      await props.updateProvider({ ...props.provider, enabled: options.enabled });
    } else {
      await props.updateProvider({ id: props.id, type: toSharedProvider(props.id), enabled: options.enabled });
    }
  };

  return (
    <>
      <AccordionSummary indicator={enabled ? undefined : null}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <SmartSwitch
            checked={checked} 
            sx={{ marginRight: 2 }} 
            onChange={async (e) => {
              e.stopPropagation();

              if (!e.target.checked) {
                setConfirmDialogOpen(true);
                return;
              }
              setChecked(e.target.checked);
              await updateProvider({ enabled: e.target.checked, id: props.id });
            }}
          />
          {title}
          {props.provider &&  sharedProviders.includes(props.provider.type as SharedProvider) && " (shared keys)"}
        </Box>
      </AccordionSummary>

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={async () => {
          setChecked(false);
          await updateProvider({ enabled: false, id: props.id });
        }}
      />
    </>
  );
}

export function ProviderAccordion(props: Props) {
  if (!props.provider?.enabled) {
    return (
      <Accordion>
        <AccordionSummaryContent {...props}/>
      </Accordion>
    );
  }

  return (
    <Accordion>
      <AccordionSummaryContent {...props} />
      <AccordionDetails>
        <ProviderForm {...props} provider={props.provider} />
      </AccordionDetails>
    </Accordion>
  );
}

function ProviderForm(props: Props & { provider: OauthProviderConfigJson }) {
  const [hasChanges, setHasChanges] = useState(false);
  const [newProvider, setNewProvider] = useState<OauthProviderConfigJson | undefined>(undefined);

  useEffect(() => {
    setNewProvider({ ...props.provider });
  }, [props.provider]);

  if (!newProvider) return null;
    
  const niceOptionProps = {
    shared: {
      title: "Shared keys (development)",
      description: "Use keys created by the Stack team for development. It helps you get started, but will show a Stack logo and name on the OAuth screen. This should never be enabled in production.",
    },
    own: {
      title: "Own keys (development & production)",
      description: "Use your own keys. Requires you to register with the provider, but lets you customize the OAuth screen.",
    },
  };

  const isShared = sharedProviders.includes(newProvider.type as SharedProvider);

  let standardForm;
  if (!isShared) {
    const p = newProvider as OauthProviderConfigJson & { type: StandardProvider };
    standardForm = (<>
      <FormControl required>
        <FormLabel>
        Client ID
        </FormLabel>
        <Input
          name="clientId"
          value={p.clientId}
          onChange={(e) => {
            setHasChanges(true);
            setNewProvider({ ...p, clientId: e.target.value });
          }}
        />
      </FormControl>

      <FormControl required>
        <FormLabel>
          Client secret
        </FormLabel>
        <Input
          name="clientSecret"
          value={p.clientSecret}
          onChange={(e) => {
            setHasChanges(true);
            setNewProvider({ ...p, clientSecret: e.target.value });
          }}
        />
      </FormControl>
    </>
    );
  }

  return (
    <form>
      <Stack spacing={2} marginY={2}>
        <FormControl required>
          <FormLabel>
            OAuth key sharing mode
          </FormLabel>
          <Select<keyof typeof niceOptionProps>
            name="keySharingMode"
            value={isShared ? "shared" : "own"}
            onChange={(e, value) => {
              // this is a hack to avoid an MUI bug
              // https://github.com/mui/material-ui/issues/36783
              if (!value) return; 

              setHasChanges(true);
              if (isShared) {
                setNewProvider({
                  ...props.provider, 
                  type: toStandardProvider(newProvider.type as SharedProvider),
                  clientId: "",
                  clientSecret: "",
                });
              } else {
                setNewProvider({...props.provider, type: toSharedProvider(newProvider.type as ProviderType)});
              }
            }}
            renderValue={(option) => {
              if (!option) return null;
              return (
                <NiceOptionContent
                  {...niceOptionProps[option.value]}
                  paddingY={1}
                />
              );
            }}
            slotProps={{
              listbox: {
                sx: { minWidth: 160 },
              },
            }}
          >
            {Object.entries(niceOptionProps).map(([value, props]) => (
              <Option key={value} value={value}>
                <NiceOptionContent {...props} />
              </Option>
            ))}
          </Select>
        </FormControl>
        
        {standardForm}

        <Stack direction="row" spacing={2}>
          <Box flexGrow={1} />
          {!!props.provider && hasChanges && (
            <AsyncButton
              type="reset"
              variant="plain"
              color="neutral"
              disabled={!hasChanges}
              onClick={async () => {
                setNewProvider(props.provider);
                setHasChanges(false);
              }}
            >
              Undo changes
            </AsyncButton>
          )}
          <AsyncButton
            type="submit"
            color="primary"
            disabled={!!props.provider && !hasChanges}
            onClick={async () => {
              await props.updateProvider(newProvider);
              setHasChanges(false);
            }}
          >
            {props.provider ? "Save" : "Create"}
          </AsyncButton>
        </Stack>
      </Stack>
    </form>
  );
}

function NiceOptionContent({ title, description, ...boxProps }: { title: string, description: string } & BoxProps) {
  return (
    <Box
      sx={{
        textAlign: "initial",
        whiteSpace: "normal",
      }}
      {...boxProps}
    >
      <Paragraph body sx={{ m: 0 }}>
        {title}
      </Paragraph>
      <Paragraph sidenote sx={{ m: 0 }}>
        {description}
      </Paragraph>
    </Box>
  );
}
