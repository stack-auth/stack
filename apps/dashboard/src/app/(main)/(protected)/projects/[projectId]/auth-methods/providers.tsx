"use client";
import * as yup from "yup";
import { OAuthProviderConfigJson } from "@stackframe/stack-shared";
import { useState } from "react";
import {
  SharedProvider,
  sharedProviders,
  standardProviders,
  toSharedProvider,
  toStandardProvider,
} from "@stackframe/stack-shared/dist/interface/clientInterface";
import { SettingIconButton, SettingSwitch } from "@/components/settings";
import { Badge } from "@/components/ui/badge";
import { ActionDialog } from "@/components/action-dialog";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import Typography from "@/components/ui/typography";
import { InputField, SwitchField } from "@/components/form-fields";
import { FormDialog } from "@/components/form-dialog";
import { SimpleTooltip } from "@/components/simple-tooltip";
import { InlineCode } from "@/components/ui/inline-code";
import { Label } from "@/components/ui/label";

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
    spotify: "Spotify",
  }[id];
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
  const isShared = sharedProviders.includes(props.provider?.type as SharedProvider);
  const defaultValues = {
    shared: isShared,
    clientId: (props.provider as any)?.clientId ?? "",
    clientSecret: (props.provider as any)?.clientSecret ?? "",
  };

  const onSubmit = async (values: ProviderFormValues) => {
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
  };

  return (
    <FormDialog
      defaultValues={defaultValues}
      formSchema={providerFormSchema}
      onSubmit={onSubmit}
      trigger={<SettingIconButton />}
      title={`${toTitle(props.id)} OAuth provider`}
      cancelButton
      okButton={{ label: 'Save' }}
      render={(form) => (
        <>
          <SwitchField
            control={form.control}
            name="shared"
            label="Shared keys"
          />

          {form.watch("shared") ?
            <Typography variant="secondary" type="footnote">
            Shared keys are created by the Stack team for development. It helps you get started, but will show a Stack logo and name on the OAuth screen. This should never be enabled in production.
            </Typography> :
            <div className="flex flex-col gap-2">
              <Label>Redirect URL for the OAuth provider settings
              </Label>
              <Typography type="footnote">
                <InlineCode>{`${process.env.NEXT_PUBLIC_STACK_URL}/api/v1/auth/callback/${props.provider?.id}`}</InlineCode>
              </Typography>
            </div>}

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
        </>
      )}
    />
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
      confirmText="I understand that this will disable sign-in and sign-up for new and existing users with this provider."
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
            {isShared && enabled &&
              <SimpleTooltip tooltip="Shared keys are automatically created by Stack, but contain Stack's logo on the OAuth sign-in page.">
                <Badge variant="secondary">Shared keys</Badge>
              </SimpleTooltip>
            }
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
