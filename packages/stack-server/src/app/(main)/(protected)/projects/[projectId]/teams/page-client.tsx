"use client";;
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { TeamTable } from "@/components/data-table/team-table";


export default function ClientPage() {
  const stackAdminApp = useAdminApp();
  const teams = stackAdminApp.useTeams();

  return (
    <PageLayout title="Teams" description="Manage your project's teams">
      <TeamTable teams={teams} />
    </PageLayout>
  );
}
