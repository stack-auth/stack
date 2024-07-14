'use client';
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Typography
} from "@stackframe/stack-ui";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Team, useUser } from "..";

type SelectedTeamSwitcherProps = {
  urlMap?: (team: Team) => string,
  selectedTeam?: Team,
  noUpdateSelectedTeam?: boolean,
};

function TeamIcon(props: { team: Team }) {
  if (props.team.profileImageUrl) {
    return (
      <div className="w-6 h-6 mr-2 rounded bg-gray-200 overflow-hidden">
        <img src={props.team.profileImageUrl} alt={props.team.displayName} className="w-6 h-6" />
      </div>
    );
  } else {
    return (
      <div className="flex items-center justify-center w-6 h-6 mr-2 rounded bg-gray-200">
        <Typography>{props.team.displayName.slice(0, 1).toUpperCase()}</Typography>
      </div>
    );
  }
}

export function SelectedTeamSwitcher(props: SelectedTeamSwitcherProps) {
  const user = useUser();
  const router = useRouter();
  const selectedTeam = user?.selectedTeam || props.selectedTeam;
  const rawTeams = user?.useTeams();
  const teams = useMemo(() => rawTeams?.sort((a, b) => b.id === selectedTeam?.id ? 1 : -1), [rawTeams, selectedTeam]);

  useEffect(() => {
    if (!props.noUpdateSelectedTeam && props.selectedTeam) {
      runAsynchronouslyWithAlert(user?.setSelectedTeam(props.selectedTeam));
    }
  }, [props.noUpdateSelectedTeam, props.selectedTeam]);

  return (
    <Select
      value={selectedTeam?.id}
      onValueChange={(value) => {
        runAsynchronouslyWithAlert(async () => {
          const team = teams?.find(team => team.id === value);
          if (!team) {
            throw new Error('Team not found, this should not happen');
          }

          if (!props.noUpdateSelectedTeam) {
            await user?.setSelectedTeam(team);
          }
          if (props.urlMap) {
            router.push(props.urlMap(team));
          }
        });
      }}
    >
      <SelectTrigger className="stack-scope">
        <SelectValue placeholder="Select team"/>
      </SelectTrigger>
      <SelectContent className="stack-scope">
        {teams && teams.map(team => (
          <SelectItem value={team.id} key={team.id}>
            <div className="flex items-center">
              <TeamIcon team={team} />
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
