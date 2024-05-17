"use client";;
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingSwitch } from "@/components/settings";

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  return (
    <PageLayout title="Emails" description="Configure email settings for your project">
      <SettingCard title="Email Server" description="The server and address all the emails will be sent from">
      </SettingCard>
    </PageLayout>
  );
}
