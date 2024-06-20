import { UserRound } from "lucide-react";
import { Text } from "..";
import { User } from "../lib/stack-app";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function UserAvatar(props: { size?: number, user: User | null }) {
  const user = props.user;
  return (
    <Avatar style={{ height: props.size || '36px', width: props.size || '36px' }}>
      <AvatarImage src={user?.profileImageUrl || ''} />
      <AvatarFallback>
        {user ? 
          <Text style={{ fontWeight: 500 }}>
            {(user.displayName || user.primaryEmail)?.slice(0, 2).toUpperCase()}
          </Text> :
          <UserRound className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />}
      </AvatarFallback>
    </Avatar>
  );
}
