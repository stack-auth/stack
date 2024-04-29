"use client";

import { Paragraph } from "@/components/paragraph";
import { TeamTable } from "./team-table";
import { useMockTeams } from "./mock-team";


export default function ClientPage() {
  const teams = useMockTeams();
  
  return (
    <>
      <Paragraph h1>
        Teams
      </Paragraph>

      <Paragraph body>
        <TeamTable rows={teams} />
      </Paragraph>
    </>
  );
}
