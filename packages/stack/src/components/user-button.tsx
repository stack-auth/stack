'use client';
import React, { Suspense } from "react";
import { useUser, Text, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, useStackApp, useDesign, Avatar, AvatarImage, AvatarFallback, Button, Skeleton, CurrentUser } from "..";
import { RxPerson, RxEnter, RxHalf2, RxFilePlus, RxPencil2 } from "react-icons/rx";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { SECONDARY_FONT_COLORS } from "../utils/constants";
import UserAvatar from "./user-avatar";
import { useRouter } from "next/navigation";
import { typedEntries, typedFromEntries } from "@stackframe/stack-shared/dist/utils/objects";
import styled from "styled-components";

const icons = typedFromEntries(typedEntries({
  RxPencil2,
  RxPerson,
  RxEnter,
  RxHalf2,
  RxFilePlus
} as const).map(([key, value]) => {
  const styledComponent = styled(value)`
    color: ${SECONDARY_FONT_COLORS.light};

    html[data-stack-theme='dark'] & {
      color: ${SECONDARY_FONT_COLORS.dark};
    }
  `;
  return [
    key,
    React.createElement(styledComponent, { size: 20 })
  ];
}));

function Item(props: { text: string, icon: React.ReactNode, onClick: () => void | Promise<void> }) {
  return (
    <DropdownMenuItem 
      onClick={() => runAsynchronously(props.onClick)}
      style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
    >
      {props.icon}
      <Text>{props.text}</Text>
    </DropdownMenuItem>
  );
}

type UserButtonProps = {
  showUserInfo?: boolean,
  colorModeToggle?: () => void | Promise<void>,
  extraItems?: {
    text: string,
    icon: React.ReactNode,
    onClick: () => void | Promise<void>,
  }[],
};

export default function UserButton(props: UserButtonProps) {
  return (
    <Suspense
      fallback={
        <Skeleton>
          <UserButtonInnerInner {...props} user={null} />
        </Skeleton>
      }
    >
      <UserButtonInner {...props} />
    </Suspense>
  );
}

function UserButtonInner(props: UserButtonProps) {
  const user = useUser();
  return <UserButtonInnerInner {...props} user={user} />;
}


function UserButtonInnerInner(props: UserButtonProps & { user: CurrentUser | null }) {
  const user = props.user;
  const app = useStackApp();
  const router = useRouter();

  const textStyles = {
    textOverflow: 'ellipsis', 
    whiteSpace: 'nowrap', 
    overflow: 'hidden'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <UserAvatar user={user} />
          {user && props.showUserInfo && <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Text style={textStyles}>{user.displayName}</Text>
            <Text style={{ ...textStyles, fontWeight: 400 }} variant="secondary" size="sm">{user.primaryEmail}</Text>
          </div>}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent style={{ zIndex: 1500 }}>
        <DropdownMenuLabel>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <UserAvatar user={user} />
            <div>
              {user && <Text>{user.displayName}</Text>}
              {user && <Text variant="secondary" size="sm" style={{ fontWeight: 400 }}>{user.primaryEmail}</Text>}
              {!user && <Text variant="secondary">Not signed in</Text>}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user && <Item 
          text="Account settings" 
          onClick={() => runAsynchronously(router.push(app.urls.accountSettings))}
          icon={icons.RxPerson}
        />}
        {!user && <Item
          text="Sign in"
          onClick={() => runAsynchronously(router.push(app.urls.signIn))}
          icon={icons.RxPerson}
        />}
        {!user && <Item
          text="Sign up"
          onClick={() => runAsynchronously(router.push(app.urls.signUp))}
          icon={icons.RxPencil2}
        />}
        {user && props.extraItems && props.extraItems.map((item, index) => (
          <Item key={index} {...item} />
        ))}
        {props.colorModeToggle && (
          <Item 
            text="Toggle theme" 
            onClick={props.colorModeToggle} 
            icon={icons.RxHalf2}
          />
        )}
        {user && <Item 
          text="Sign out" 
          onClick={() => user.signOut()} 
          icon={icons.RxEnter}
        />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
