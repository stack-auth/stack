'use client';
import { Team, useUser } from "..";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Typography,
} from "@stackframe/stack-ui";
import { useEffect, useMemo } from "react";

type SelectedTeamSwitcherProps = {
  urlMap?: (team: Team) => string,
  selectedTeam?: Team,
  noUpdateSelectedTeam?: boolean,
};

function TeamIcon(props: { displayName: string }) {
  return (
    <div className="flex items-center justify-center w-6 h-6 mr-2 rounded bg-gray-200">
      <Typography>{props.displayName.slice(0, 1).toUpperCase()}</Typography>
    </div>
  );
}

export function SelectedTeamSwitcher(props: SelectedTeamSwitcherProps) {
  const user = useUser();
  const router = useRouter();
  const selectedTeam = user?.selectedTeam || props.selectedTeam;
  const rawTeams = user?.useTeams();
  const teams = useMemo(() => rawTeams?.sort((a, b) => b.id === selectedTeam?.id ? 1 : -1), [rawTeams, selectedTeam]);

  useEffect(() => {
    if (!props.noUpdateSelectedTeam && teams && teams[0]) {
      runAsynchronouslyWithAlert(user?.setSelectedTeam(teams[0]));
    }
  }, [teams, selectedTeam, props.noUpdateSelectedTeam]);

  return (
    <Select>
      <SelectTrigger className="stack-scope">
        <SelectValue placeholder="Select team"/>
      </SelectTrigger>
      <SelectContent className="stack-scope">
        {teams && teams.map(team => (
          <SelectItem
            value={team.id}
            key={team.id}
            onClick={() => {
              runAsynchronouslyWithAlert(async () => {
                if (!props.noUpdateSelectedTeam) {
                  await user?.setSelectedTeam(team);
                }
                if (props.urlMap) {
                  router.push(props.urlMap(team));
                }
              });
            }}
          >
            <div className="flex items-center">
              <TeamIcon displayName={team.displayName} />
              <Typography>{team.displayName}</Typography>
            </div>
          </SelectItem>
        ))}

        {teams?.length === 0 && (
          <SelectGroup>
            <SelectLabel>No teams</SelectLabel>
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
