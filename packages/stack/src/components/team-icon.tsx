import Image from "next/image";
import { Team } from "..";
import { Typography } from "@stackframe/stack-ui";

export function TeamIcon(props: { team: Team }) {
  if (props.team.profileImageUrl) {
    return (
      <div className="w-6 h-6 rounded bg-gray-200 overflow-hidden">
        <Image src={props.team.profileImageUrl} alt={props.team.displayName} className="w-6 h-6" />
      </div>
    );
  } else {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-200">
        <Typography>{props.team.displayName.slice(0, 1).toUpperCase()}</Typography>
      </div>
    );
  }
}