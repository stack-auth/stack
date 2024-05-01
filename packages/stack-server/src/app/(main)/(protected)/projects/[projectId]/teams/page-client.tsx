"use client";

import { Paragraph } from "@/components/paragraph";
import { TeamTable } from "./team-table";
import { useMockTeams } from "./mock-team";
import { EnableTeam } from "../enable-team";
import { useUser } from "@stackframe/stack";


export default function ClientPage() {
  const teams = useMockTeams();
  const user = useUser();

  console.log(user);
  
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
