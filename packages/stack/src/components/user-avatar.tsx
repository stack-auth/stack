import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Text } from "..";
import { User } from "../lib/stack-app";
import styled from "styled-components";

const StyledIcon = styled(UserRound)`
  height: 1.25rem;
  width: 1.25rem;
  color: #666666;

  html[data-stack-theme='dark'] & {
    color: #999999;
  }
`;

export default function UserAvatar(props: { size?: number, user: User | null }) {
  const user = props.user;
  return (
    <Avatar style={{ height: props.size, width: props.size }}>
      <AvatarImage src={user?.profileImageUrl || ''} />
      <AvatarFallback>
        {user ? 
          <Text style={{ fontWeight: 500 }}>
            {(user.displayName || user.primaryEmail)?.slice(0, 2).toUpperCase()}
          </Text> :
          <StyledIcon size={props.size} />}
      </AvatarFallback>
    </Avatar>
  );
}
