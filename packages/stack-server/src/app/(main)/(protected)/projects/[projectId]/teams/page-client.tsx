"use client";

import { Paragraph } from "@/components/paragraph";
import { TeamTable } from "./team-table";
import { useMockTeams } from "./mock-team";
import { EnableTeam } from "../enable-team";
import { useUser } from "@stackframe/stack";
import { useEffect } from "react";


export default function ClientPage() {
  const teams = useMockTeams();
  const user = useUser({ or: "throw" });

  // async useEffect
  useEffect(() => {
    async function fetchTeams() {
      const teams = await user.listTeams();
      console.log(teams);
    }
    fetchTeams().catch(console.error);
  }, [user]);
  
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
