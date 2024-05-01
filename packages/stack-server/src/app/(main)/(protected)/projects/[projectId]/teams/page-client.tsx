"use client";

import { Paragraph } from "@/components/paragraph";
import { TeamTable } from "./team-table";
import { EnableTeam } from "../enable-team";
import { useAdminApp } from "../use-admin-app";


export default function ClientPage() {
  const stackAdminApp = useAdminApp();
  const teams = stackAdminApp.useTeams();

  return (
    <>
      <Paragraph h1>
        Teams
      </Paragraph>

      <EnableTeam>
        <TeamTable rows={teams} />
      </EnableTeam>
    </>
  );
}
