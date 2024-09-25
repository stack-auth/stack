"use client";

import { SettingCard, SettingSwitch } from "@/components/settings";
import { allProviders } from "@stackframe/stack-shared/dist/utils/oauth";
import { ActionDialog, Typography } from "@stackframe/stack-ui";
import { useState } from "react";
import { CardSubtitle } from "../../../../../../../../../packages/stack-ui/dist/components/ui/card";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";
import { ProviderSettingSwitch } from "./providers";

function ConfirmSignUpEnabledDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
}) {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProject();

  return (
    <ActionDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="Enable sign-up"
      danger
      okButton={{
        label: "Enable Sign-up",
        onClick: async () => {
          await project.update({
            config: {
              signUpEnabled: true,
            },
          });
        }
      }}
      cancelButton
    >
      <Typography>
        Do you really want to enable sign-up for your project? Anyone will be able to create an account on your project.
      </Typography>
    </ActionDialog>
  );
}

function ConfirmSignUpDisabledDialog(props: {
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
}) {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProject();

  return (
    <ActionDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="Disable sign-up"
      danger
      okButton={{
        label: "Disable Sign-up",
        onClick: async () => {
          await project.update({
            config: {
              signUpEnabled: false,
            },
          });
        }
      }}
      cancelButton
    >
      <Typography>
        Do you really want to disable sign-up for your project? No one except for the project admins will be able to create new accounts. However, existing users will still be able to sign in.
      </Typography>
    </ActionDialog>
  );
}

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProject();
  const oauthProviders = project.config.oauthProviders;
  const [confirmSignUpEnabled, setConfirmSignUpEnabled] = useState(false);
  const [confirmSignUpDisabled, setConfirmSignUpDisabled] = useState(false);

  return (
    <PageLayout title="Auth Methods" description="Configure how users can sign in to your app">
      <SettingCard>
        <CardSubtitle>
          Email-based
        </CardSubtitle>
        <SettingSwitch
          label="Email password authentication"
          checked={project.config.credentialEnabled}
          onCheckedChange={async (checked) => {
            await project.update({
              config: {
                credentialEnabled: checked,
              },
            });
          }}
        />
        <SettingSwitch
          label="Magic link/OTP"
          checked={project.config.magicLinkEnabled}
          onCheckedChange={async (checked) => {
            await project.update({
              config: {
                magicLinkEnabled: checked,
              },
            });
          }}
        />
        <CardSubtitle className="mt-2">
          SSO (OAuth)
        </CardSubtitle>
        {allProviders.map((id) => {
          const provider = oauthProviders.find((provider) => provider.id === id);
          return <ProviderSettingSwitch
            key={id}
            id={id}
            provider={provider}
            updateProvider={async (provider) => {
              const alreadyExist = oauthProviders.some((p) => p.id === id);
              const newOAuthProviders = oauthProviders.map((p) => p.id === id ? provider : p);
              if (!alreadyExist) {
                newOAuthProviders.push(provider);
              }
              await project.update({
                config: { oauthProviders: newOAuthProviders },
              });
            }}
          />;
        })}
      </SettingCard>
      <SettingCard title="Sign-up">
        <SettingSwitch
          label="Allow new user sign-ups"
          checked={project.config.signUpEnabled}
          onCheckedChange={async (checked) => {
            if (checked) {
              setConfirmSignUpEnabled(true);
            } else {
              setConfirmSignUpDisabled(true);
            }
          }}
          hint="Existing users can still sign in when sign-up is disabled. You can always create new accounts manually via the dashboard."
        />
      </SettingCard>

      <SettingCard title="User deletion">
        <SettingSwitch
          label="Allow users to delete their own accounts on the client-side"
          checked={project.config.clientUserDeletionEnabled}
          onCheckedChange={async (checked) => {
            await project.update({
              config: {
                clientUserDeletionEnabled: checked,
              },
            });
          }}
        />
        <Typography variant="secondary" type="footnote">
          An delete button will also be added to the account settings page.
        </Typography>
      </SettingCard>

      <ConfirmSignUpEnabledDialog
        open={confirmSignUpEnabled}
        onOpenChange={setConfirmSignUpEnabled}
      />
      <ConfirmSignUpDisabledDialog
        open={confirmSignUpDisabled}
        onOpenChange={setConfirmSignUpDisabled}
      />
    </PageLayout>
  );
}
