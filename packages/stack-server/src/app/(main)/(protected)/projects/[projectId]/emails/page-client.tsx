"use client";;
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingInput } from "@/components/settings";

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  return (
    <PageLayout title="Emails" description="Configure emails for your project">
      <SettingCard title="Email Server" description="The email address of all outgoing emails">
      </SettingCard>
    </PageLayout>
  );
}
