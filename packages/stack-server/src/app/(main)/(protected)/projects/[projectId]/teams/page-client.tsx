"use client";

import { Paragraph } from "@/components/paragraph";
import { TeamTable } from "./team-table";
import { EnableTeam } from "../enable-team";
import { useUser } from "@stackframe/stack";
import { useEffect } from "react";
import { useAdminApp } from "../use-admin-app";


export default function ClientPage() {
  const stackAdminApp = useAdminApp();
  const teams = stackAdminApp.useTeams();

  // const user = useUser({ or: "throw" });
  // useEffect(() => {
  //   async function fetchTeams() {
  //     // const teams = await user.listTeams();
  //     // const newTeam = await stackAdminApp.createTeam({ displayName: "New Team" });
  //     const teams = await stackAdminApp.listTeams();
  //     console.log(teams);
  //   }
  //   fetchTeams().catch(console.error);
  // }, []);
  
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
