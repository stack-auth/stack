"use client";;
import { Paragraph } from "@/components/paragraph";
import { TeamTable } from "./team-table";
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";


export default function ClientPage() {
  const stackAdminApp = useAdminApp();
  const teams = stackAdminApp.useTeams();

  return (
    <PageLayout title="Teams" description="Manage your project's teams">
      <TeamTable rows={teams} />
    </PageLayout>
  );
}
