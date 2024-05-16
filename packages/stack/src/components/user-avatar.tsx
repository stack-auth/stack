import { RxPerson } from "react-icons/rx";
import { Avatar, AvatarFallback, AvatarImage, Text } from "..";
import { User } from "../lib/stack-app";
import { SECONDARY_FONT_COLORS } from "../utils/constants";
import styled from "styled-components";


const StyledIcon = styled(RxPerson)`
  color: ${SECONDARY_FONT_COLORS.light};
  html[data-stack-theme='dark'] & {
    color: ${SECONDARY_FONT_COLORS.dark};
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
            {(user?.displayName || user?.primaryEmail)?.slice(0, 2).toUpperCase()}
          </Text> :
          <StyledIcon size={props.size} />}
      </AvatarFallback>
    </Avatar>
  );
}
