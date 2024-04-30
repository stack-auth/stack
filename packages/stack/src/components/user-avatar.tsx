import { RxPerson } from "react-icons/rx";
import { Avatar, AvatarFallback, AvatarImage, Text } from "..";
import { User } from "../lib/stack-app";

export default function UserAvatar(props: { size?: number, user: User | null }) {
  const user = props.user;
  return (
    <Avatar style={{ height: props.size, width: props.size }}>
      <AvatarImage src={user?.profileImageUrl || ''} />
      <AvatarFallback>
        {user ? 
          <Text style={{ fontWeight: 500 }}>
            {(user?.displayName || user?.primaryEmail)?.slice(0, 2).toUpperCase()}
          </Text> :
          <RxPerson size={props.size} />}
      </AvatarFallback>
    </Avatar>
  );
}
