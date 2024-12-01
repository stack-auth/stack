"use client";
import { FormDialog } from "@/components/form-dialog";
import { InputField, SwitchField } from "@/components/form-fields";
import { SettingIconButton, SettingSwitch } from "@/components/settings";
import { AdminProject } from "@stackframe/stack";
import { sharedProviders } from "@stackframe/stack-shared/dist/utils/oauth";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { ActionDialog, Badge, InlineCode, Label, SimpleTooltip, Typography } from "@stackframe/stack-ui";
import { useState } from "react";
import * as yup from "yup";

type Props = {
  id: string,
  provider?: AdminProject['config']['oauthProviders'][number],
  updateProvider: (provider: AdminProject['config']['oauthProviders'][number]) => Promise<void>,
};

function toTitle(id: string) {
  return {
    github: "GitHub",
    google: "Google",
    facebook: "Facebook",
    microsoft: "Microsoft",
    spotify: "Spotify",
    discord: "Discord",
    gitlab: "GitLab",
    apple: "Apple",
    bitbucket: "Bitbucket",
    linkedin: "LinkedIn",
    x: "X",
  }[id];
}

export const providerFormSchema = yup.object({
  shared: yup.boolean().defined(),
  clientId: yup.string()
    .when('shared', {
      is: false,
      then: (schema) => schema.defined(),
      otherwise: (schema) => schema.optional()
    }),
  clientSecret: yup.string()
    .when('shared', {
      is: false,
      then: (schema) => schema.defined(),
      otherwise: (schema) => schema.optional()
    }),
  facebookConfigId: yup.string().optional(),
  microsoftTenantId: yup.string().optional(),
});

export type ProviderFormValues = yup.InferType<typeof providerFormSchema>

export function ProviderSettingDialog(props: Props & { open: boolean, onClose: () => void }) {
  const hasSharedKeys = sharedProviders.includes(props.id as any);
  const defaultValues = {
    shared: props.provider ? (props.provider.type === 'shared') : hasSharedKeys,
    clientId: (props.provider as any)?.clientId ?? "",
    clientSecret: (props.provider as any)?.clientSecret ?? "",
    facebookConfigId: (props.provider as any)?.facebookConfigId ?? "",
    microsoftTenantId: (props.provider as any)?.microsoftTenantId ?? "",
  };

  const onSubmit = async (values: ProviderFormValues) => {
    if (values.shared) {
      await props.updateProvider({ id: props.id, type: 'shared', enabled: true });
    } else {
      await props.updateProvider({
        id: props.id,
        type: 'standard',
        enabled: true,
        clientId: values.clientId || "",
        clientSecret: values.clientSecret || "",
        facebookConfigId: values.facebookConfigId,
        microsoftTenantId: values.microsoftTenantId,
      });
    }
  };

  return (
    <FormDialog
      defaultValues={defaultValues}
      formSchema={providerFormSchema}
      onSubmit={onSubmit}
      open={props.open}
      onClose={props.onClose}
      title={`${toTitle(props.id)} OAuth provider`}
      cancelButton
      okButton={{ label: 'Save' }}
      render={(form) => (
        <>
          {hasSharedKeys ?
            <SwitchField
              control={form.control}
              name="shared"
              label="Shared keys"
            /> :
            <Typography variant="secondary" type="footnote">
              This OAuth provider does not support shared keys
            </Typography>}

          {form.watch("shared") ?
            <Typography variant="secondary" type="footnote">
              Shared keys are created by the Stack team for development. It helps you get started, but will show a Stack logo and name on the OAuth screen. This should never be enabled in production.
            </Typography> :
            <div className="flex flex-col gap-2">
              <Label>Redirect URL for the OAuth provider settings
              </Label>
              <Typography type="footnote">
                <InlineCode>{`${process.env.NEXT_PUBLIC_STACK_API_URL}/api/v1/auth/oauth/callback/${props.id}`}</InlineCode>
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

              {props.id === 'facebook' && (
                <InputField
                  control={form.control}
                  name="facebookConfigId"
                  label="Configuration ID (only required for Facebook Business)"
                  placeholder="Facebook Config ID"
                />
              )}

              {props.id === 'microsoft' && (
                <InputField
                  control={form.control}
                  name="microsoftTenantId"
                  label="Tenant ID (required if you are using the organizational directory)"
                  placeholder="Tenant ID"
                />
              )}
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
  providerId: string,
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
  const isShared = props.provider?.type === 'shared';
  const [TurnOffProviderDialogOpen, setTurnOffProviderDialogOpen] = useState(false);
  const [ProviderSettingDialogOpen, setProviderSettingDialogOpen] = useState(false);

  const updateProvider = async (checked: boolean) => {
    await props.updateProvider({
      id: props.id,
      type: 'shared',
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
              <SimpleTooltip tooltip={"Shared keys are automatically created by Stack, but show Stack's logo on the OAuth sign-in page.\n\nYou should replace these before you go into production."}>
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
            setProviderSettingDialogOpen(true);
          }
        }}
        actions={<SettingIconButton onClick={() => setProviderSettingDialogOpen(true)} />}
        onlyShowActionsWhenChecked
      />

      <TurnOffProviderDialog
        open={TurnOffProviderDialogOpen}
        onClose={() => setTurnOffProviderDialogOpen(false)}
        providerId={props.id}
        onConfirm={() => runAsynchronously(updateProvider(false))}
      />

      <ProviderSettingDialog {...props} open={ProviderSettingDialogOpen} onClose={() => setProviderSettingDialogOpen(false)} />
    </>
  );
}
