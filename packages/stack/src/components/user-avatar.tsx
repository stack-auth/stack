import { Avatar, AvatarFallback, AvatarImage, useUser } from "..";

export default function UserAvatar(props: { size?: number }) {
  const user = useUser();

  if (!user) {
    return null;
  }

  return (
    <Avatar style={{ height: props.size, width: props.size }}>
      <AvatarImage src={user.profileImageUrl || ''} />
      <AvatarFallback>{(user.displayName || user.primaryEmail)?.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}