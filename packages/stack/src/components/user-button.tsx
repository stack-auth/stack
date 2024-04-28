'use client';
import React, { Suspense } from "react";
import { useUser, Text, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, useStackApp, useDesign, Avatar, AvatarImage, AvatarFallback, Button, Skeleton, CurrentUser } from "..";
import { RxPerson, RxEnter, RxSun, RxShadow, RxPlus, RxFile, RxFilePlus } from "react-icons/rx";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { SECONDARY_FONT_COLORS } from "../utils/constants";
import UserAvatar from "./user-avatar";
import { useRouter } from "next/navigation";
import { suspend } from "@stackframe/stack-shared/dist/utils/react";

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
  showColorMode?: boolean,
};

export default function UserButton({
  showUserInfo = false,
  showColorMode = false,
}: UserButtonProps) {
  return (
    <Suspense
      fallback={
        <Skeleton>
          <UserButtonInnerInner showUserInfo={showUserInfo} showColorMode={showColorMode} user={null} />
        </Skeleton>
      }
    >
      <UserButtonInner showUserInfo={showUserInfo} showColorMode={showColorMode} />
    </Suspense>
  );
}

function UserButtonInner(props: UserButtonProps) {
  const user = useUser();
  return <UserButtonInnerInner showUserInfo={props.showUserInfo} showColorMode={props.showColorMode} user={user} />;
}


function UserButtonInnerInner(props: UserButtonProps & { user: CurrentUser | null }) {
  const { colorMode, setColorMode } = useDesign();
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
              {!user && <Text variant="secondary">Not logged in</Text>}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user && <Item 
          text="Account settings" 
          onClick={() => runAsynchronously(router.push(app.urls.accountSettings))}
          icon={<RxPerson size={22} color={SECONDARY_FONT_COLORS[colorMode]} />}
        />}
        {!user && <Item
          text="Sign in"
          onClick={() => runAsynchronously(router.push(app.urls.signIn))}
          icon={<RxEnter size={22} color={SECONDARY_FONT_COLORS[colorMode]} />}
        />}
        {!user && <Item
          text="Sign up"
          onClick={() => runAsynchronously(router.push(app.urls.signUp))}
          icon={<RxFilePlus size={22} color={SECONDARY_FONT_COLORS[colorMode]} />}
        />}
        {props.showColorMode && <Item 
          text={colorMode === 'dark' ? 'Light theme' : 'Dark theme'}
          onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
          icon={
            colorMode === 'dark' ? 
              <RxSun size={22} color={SECONDARY_FONT_COLORS[colorMode]} /> : 
              <RxShadow size={22} color={SECONDARY_FONT_COLORS[colorMode]} />
          }
        />}
        {user && <Item 
          text="Sign out" 
          onClick={() => user.signOut()} 
          icon={<RxEnter size={22} color={SECONDARY_FONT_COLORS[colorMode]} />} 
        />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
