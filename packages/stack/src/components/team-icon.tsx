import { Team } from "..";
import { Avatar, AvatarImage, Typography } from "@stackframe/stack-ui";

export function TeamIcon(props: { team: Team }) {
  if (props.team.profileImageUrl) {
    return (
      <Avatar className="w-6 h-6 rounded">
        <AvatarImage src={props.team.profileImageUrl} alt={props.team.displayName} />
      </Avatar>
    );
  } else {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded bg-zinc-200">
        <Typography className="text-zinc-800 dark:text-zinc-800">{props.team.displayName.slice(0, 1).toUpperCase()}</Typography>
      </div>
    );
  }
}
