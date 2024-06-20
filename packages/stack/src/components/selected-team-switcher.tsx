'use client';

import { useUser } from "..";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Typography from "./ui/typography";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "./ui/dropdown-menu";

type SelectedTeamSwitcherProps = {
  projectUrlMap?: (projectId: string) => string,
};

function TeamIcon(props: { displayName: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '1.5rem', height: '1.5rem', marginRight: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'rgb(228 228 231)' }}>
      <Typography>{props.displayName.slice(0, 1).toUpperCase()}</Typography>
    </div>
  );
}

export default function SelectedTeamSwitcher(props: SelectedTeamSwitcherProps) {
  const user = useUser();
  const router = useRouter();
  const selectedTeam = user?.selectedTeam;
  const rawTeams = user?.useTeams();
  const teams = useMemo(() => rawTeams?.sort((a, b) => b.id === selectedTeam?.id ? 1 : -1), [rawTeams, selectedTeam]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TeamIcon displayName={selectedTeam?.displayName || ''} />
          <Typography>{selectedTeam?.displayName || 'Select team'}</Typography>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Teams</DropdownMenuLabel>
        {teams && teams.map(team => (
          <DropdownMenuItem
            key={team.id}
            onClick={() => {
              runAsynchronouslyWithAlert(async () => {
                await user?.setSelectedTeam(team);
                if (props.projectUrlMap) {
                  router.push(props.projectUrlMap(team.id));
                }
              });
            }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TeamIcon displayName={team.displayName} />
              <Typography>{team.displayName}</Typography>
            </div>
            <Check style={{ marginLeft: '0.5rem', visibility: team.id === selectedTeam?.id ? 'visible' : 'hidden', height: '1rem', width: '1rem' }} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
