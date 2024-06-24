import { UserRound } from "lucide-react";
import { User } from "../../lib/stack-app";
import { Avatar, AvatarFallback, AvatarImage } from "@stackframe/stack-ui";

export function UserAvatar(props: { size?: number, user: User | null }) {
  const user = props.user;
  return (
    <Avatar style={{ height: props.size || '34px', width: props.size || '34px' }}>
      <AvatarImage src={user?.profileImageUrl || ''} />
      <AvatarFallback>
        {user ? 
          <div className='font-medium'>
            {(user.displayName || user.primaryEmail)?.slice(0, 2).toUpperCase()}
          </div> :
          <UserRound className="h-5 w-5 text-zinc-500" />}
      </AvatarFallback>
    </Avatar>
  );
}
