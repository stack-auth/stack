"use client";;
import {
  AccordionSummary,
  Select,
  Option,
  Box,
  Stack,
  BoxProps,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalDialog,
  DialogTitle,
  Divider,
  Checkbox,
  DialogActions,
} from "@mui/joy";
import * as yup from "yup";
import { OAuthProviderConfigJson } from "@stackframe/stack-shared";
import { useEffect, useId, useRef, useState } from "react";
import { Paragraph } from "@/components/paragraph";
import { Button } from "@/components/ui/button";
import { SharedProvider, StandardProvider, sharedProviders, standardProviders, toSharedProvider, toStandardProvider } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { SmartSwitch } from "@/components/smart-switch";
import { DialogContent } from "@mui/material";
import { SettingIconButton, SettingSwitch } from "@/components/settings";
import { Badge } from "@/components/ui/badge";
import { ActionDialog } from "@/components/action-dialog";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import Typography from "@/components/ui/typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { InputField, SwitchField } from "@/components/form-fields";
import { Form } from "@/components/ui/form";

/**
 * All the different types of OAuth providers that can be created.
 */
export const availableProviders = standardProviders;
export type ProviderType = typeof availableProviders[number];

type Props = {
  id: ProviderType,
  provider?: OAuthProviderConfigJson,
  updateProvider: (provider: OAuthProviderConfigJson) => Promise<void>,
};

function toTitle(id: ProviderType) {
  return {
    github: "GitHub",
    google: "Google",
    facebook: "Facebook",
    microsoft: "Microsoft",
  }[id] ?? `Custom OAuth provider: ${id}`;
}

export const providerFormSchema = yup.object({
  shared: yup.boolean().required(),
  clientId: yup.string()
    .when('shared', {
      is: false,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.optional()
    }),
  clientSecret: yup.string()
    .when('shared', {
      is: false,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.optional()
    }),
});

export type ProviderFormValues = yup.InferType<typeof providerFormSchema>

export function ProviderSettingDialog(props: Props) {
  const formId = useId();
  const isShared = sharedProviders.includes(props.provider?.type as SharedProvider);
  const form = useForm<ProviderFormValues>({
    resolver: yupResolver<ProviderFormValues>(providerFormSchema),
    defaultValues: { 
      shared: isShared, 
      clientId: (props.provider as any)?.clientId ?? "", 
      clientSecret: (props.provider as any)?.clientSecret ?? "" 
    },
    mode: "onChange",
  });
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values: ProviderFormValues, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    setSubmitting(true);

    try {
      if (values.shared) {
        await props.updateProvider({ id: props.id, type: toSharedProvider(props.id), enabled: true });
      } else {
        await props.updateProvider({
          id: props.id,
          type: toStandardProvider(props.id),
          enabled: true,
          clientId: values.clientId || "",
          clientSecret: values.clientSecret || "",
        });
      }
      form.reset(values);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ActionDialog
      open={open}
      onClose={() => { form.reset(); setOpen(false); }}
      trigger={<SettingIconButton onClick={() => setOpen(true)} />}
      title={`${toTitle(props.id)} OAuth provider`}
      cancelButton
      okButton={{
        label: 'Save',
        props: { form: formId, type: "submit", loading: submitting },
        onClick: async () => "prevent-close",
      }}
    >
      <Form {...form}>
        <form onSubmit={e => runAsynchronously(form.handleSubmit(onSubmit)(e))} className="space-y-4" id={formId}>
          <SwitchField
            control={form.control}
            name="shared"
            label="Shared keys"
          />

          {form.watch("shared") && <Typography variant="secondary" type="footnote">
            Shared keys are created by the Stack team for development. It helps you get started, but will show a Stack logo and name on the OAuth screen. This should never be enabled in production.
          </Typography>}

          {!form.watch("shared") && (
            <>
              <InputField
                control={form.control}
                name="clientId"
                label="Client ID"
                placeholder="Client ID"
                required
              />

              <InputField
                control={form.control}
                name="clientSecret"
                label="Client Secret"
                placeholder="Client Secret"
                required
              />
            </>
          )}
        </form>
      </Form>
    </ActionDialog>
  );
}

export function TurnOffProviderDialog(props: { 
  open: boolean, 
  onClose: () => void,
  onConfirm: () => void,
  providerId: ProviderType,
}) {
  return (
    <ActionDialog
      title={`Disable ${toTitle(props.providerId)} OAuth provider`}
      open={props.open}
      onClose={props.onClose}
      danger
      okButton={{
        label: `Disable ${toTitle(props.providerId)}`,
        onClick: async () => {
          props.onConfirm();
        },
      }}
      cancelButton
      confirmText="I understand that this will disable sign-in and sign-up for new and existing users with this provider"
    >
      <Typography>
        Disabling this provider will prevent users from signing in with it, including existing users who have used it before. They might not be able to log in anymore. Are you sure you want to do this?
      </Typography>
    </ActionDialog>
  );
}

export function ProviderSettingSwitch(props: Props) {
  const enabled = !!props.provider?.enabled;
  const isShared = sharedProviders.includes(props.provider?.type as SharedProvider);
  const [TurnOffProviderDialogOpen, setTurnOffProviderDialogOpen] = useState(false);

  const updateProvider = async (checked: boolean) => {
    await props.updateProvider({
      id: props.id,
      type: toSharedProvider(props.id),
      ...props.provider,
      enabled: checked 
    });
  };

  return (
    <>
      <SettingSwitch
        label={
          <div className="flex items-center gap-2">
            {toTitle(props.id)}
            {isShared && enabled && <Badge variant="outline">shared keys</Badge>}
          </div>
        }
        checked={enabled}
        onCheckedChange={async (checked) => {
          if (!checked) {
            setTurnOffProviderDialogOpen(true);
            return;
          } else {
            await updateProvider(checked);
          }
        }}
        actions={
          <ProviderSettingDialog {...props} />
        }
        onlyShowActionsWhenChecked
      />
      
      <TurnOffProviderDialog 
        open={TurnOffProviderDialogOpen}
        onClose={() => setTurnOffProviderDialogOpen(false)}
        providerId={props.id}
        onConfirm={() => runAsynchronously(updateProvider(false))}
      />
    </>
  );
}
