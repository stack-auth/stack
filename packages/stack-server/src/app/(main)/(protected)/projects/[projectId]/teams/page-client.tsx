"use client";

import { Paragraph } from "@/components/paragraph";
import { TeamTable } from "./team-table";
import { useMockTeams } from "./mock-team";
import { EnableTeam } from "../enable-team";


export default function ClientPage() {
  const teams = useMockTeams();
  
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
