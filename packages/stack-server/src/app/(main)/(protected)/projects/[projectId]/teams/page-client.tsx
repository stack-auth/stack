"use client";

import { Paragraph } from "@/components/paragraph";
import { TeamTable } from "./team-table";
import { useMockTeams } from "./mock-team";
import { EnableTeam } from "../enable-team";
import { useUser } from "@stackframe/stack";
import { useEffect } from "react";
import { useAdminApp } from "../use-admin-app";


export default function ClientPage() {
  const teams = useMockTeams();
  const stackAdminApp = useAdminApp();
  const user = useUser({ or: "throw" });

  // async useEffect
  useEffect(() => {
    async function fetchTeams() {
      // const teams = await user.listTeams();
      // const newTeam = await stackAdminApp.createTeam({ displayName: "New Team" });
      const teams = await stackAdminApp.listTeams();
      console.log(teams);
    }
    fetchTeams().catch(console.error);
  }, []);
  
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
