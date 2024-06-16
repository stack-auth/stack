'use client';
import React, { Suspense, useEffect, useState } from "react";
import {
  useUser,
  Text,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  useStackApp,
  Skeleton,
  CurrentUser,
} from "..";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import UserAvatar from "./user-avatar";
import { useRouter } from "next/navigation";
import { typedEntries, typedFromEntries } from "@stackframe/stack-shared/dist/utils/objects";
import styled from "styled-components";
import { CircleUser, LogIn, SunMoon, UserPlus, LogOut } from "lucide-react";

const icons = typedFromEntries(typedEntries({
  CircleUser,
  UserPlus,
  SunMoon,
  LogIn,
  LogOut,
} as const).map(([key, value]) => {
  const styledComponent = styled(value)`
    height: 1rem;
    width: 1rem;
  `;
  return [
    key,
    React.createElement(styledComponent, { size: 20 })
  ];
}));

function Item(props: { text: string, icon: React.ReactNode, onClick: () => void | Promise<void> }) {
  return (
    <DropdownMenuItem 
      onClick={() => runAsynchronouslyWithAlert(props.onClick)}
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
  const [uploadAvatar,setUploadAvatar]=useState('');;
  const textStyles = {
    textOverflow: 'ellipsis', 
    whiteSpace: 'nowrap', 
    overflow: 'hidden',
    margin: 0,
  };
  useEffect(() => {
    if(user){
      user.getProfileImage(user.id)
      .then(uploadedImage => {
        if (uploadedImage) {
          setUploadAvatar(uploadedImage.data.userProfileImage);
        } else {
        }
      })
      }
  },[])
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <UserAvatar user={user} uploadAvatar={uploadAvatar||null}/>
          {user && props.showUserInfo && <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Text style={textStyles}>{user.displayName}</Text>
            <Text style={{ ...textStyles, fontWeight: 400 }} variant="secondary" size="sm">{user.primaryEmail}</Text>
          </div>}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent style={{ zIndex: 1500 }}>
        <DropdownMenuLabel>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <UserAvatar user={user} uploadAvatar={uploadAvatar||null}/>
            <div>
              {user && <Text>{user.displayName}</Text>}
              {user && <Text variant="secondary" size="sm" style={{ fontWeight: 400 }}>{user.primaryEmail}</Text>}
              {!user && <Text>Not signed in</Text>}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user && <Item 
          text="Account settings" 
          onClick={() => router.push(app.urls.accountSettings)}
          icon={icons.CircleUser}
        />}
        {!user && <Item
          text="Sign in"
          onClick={() => router.push(app.urls.signIn)}
          icon={icons.LogIn}
        />}
        {!user && <Item
          text="Sign up"
          onClick={() => router.push(app.urls.signUp)}
          icon={icons.UserPlus}
        />}
        {user && props.extraItems && props.extraItems.map((item, index) => (
          <Item key={index} {...item} />
        ))}
        {props.colorModeToggle && (
          <Item 
            text="Toggle theme" 
            onClick={props.colorModeToggle} 
            icon={icons.SunMoon}
          />
        )}
        {user && <Item 
          text="Sign out" 
          onClick={() => user.signOut()} 
          icon={icons.LogOut}
        />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
