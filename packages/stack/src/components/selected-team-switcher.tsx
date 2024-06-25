'use client';
import { useUser } from "..";
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
import { useMemo } from "react";

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

export function SelectedTeamSwitcher(props: SelectedTeamSwitcherProps) {
  const user = useUser();
  const router = useRouter();
  const selectedTeam = user?.selectedTeam;
  const rawTeams = user?.useTeams();
  const teams = useMemo(() => rawTeams?.sort((a, b) => b.id === selectedTeam?.id ? 1 : -1), [rawTeams, selectedTeam]);

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
                await user?.setSelectedTeam(team);
                if (props.projectUrlMap) {
                  router.push(props.projectUrlMap(team.id));
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
