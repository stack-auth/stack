'use client';
import React from "react";
import { useUser, Text, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, useStackApp, useDesign, Avatar, AvatarImage, AvatarFallback, Button } from "..";
import { RxPerson, RxEnter, RxSun, RxShadow } from "react-icons/rx";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { SECONDARY_FONT_COLORS } from "../utils/constants";
import UserAvatar from "./user-avatar";
import { useRouter } from "next/navigation";

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

export default function UserButton({
  showUserInfo = false,
  showColorMode = true,
}: {
  showUserInfo?: boolean,
  showColorMode?: boolean,
}) {
  const { colorMode, setColorMode } = useDesign();
  const user = useUser();
  const app = useStackApp();
  const router = useRouter();

  const textStyles = {
    textOverflow: 'ellipsis', 
    whiteSpace: 'nowrap', 
    overflow: 'hidden'
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <UserAvatar/>
          {showUserInfo && <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Text style={textStyles}>{user.displayName}</Text>
            <Text style={{ ...textStyles, fontWeight: 400 }} variant="secondary" size="sm">{user.primaryEmail}</Text>
          </div>}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent style={{ zIndex: 1500 }}>
        <DropdownMenuLabel>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <UserAvatar/>
            <div>
              <Text>{user.displayName}</Text>
              <Text variant="secondary" size="sm" style={{ fontWeight: 400 }}>{user.primaryEmail}</Text>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Item 
          text="Account settings" 
          onClick={() => runAsynchronously(router.push(app.urls.accountSettings))}
          icon={<RxPerson size={22} color={SECONDARY_FONT_COLORS[colorMode]} />}
        />
        {showColorMode && <Item 
          text={colorMode === 'dark' ? 'Light theme' : 'Dark theme'}
          onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
          icon={
            colorMode === 'dark' ? 
              <RxSun size={22} color={SECONDARY_FONT_COLORS[colorMode]} /> : 
              <RxShadow size={22} color={SECONDARY_FONT_COLORS[colorMode]} />
          }
        />}
        <Item 
          text="Sign out" 
          onClick={() => user.signOut()} 
          icon={<RxEnter size={22} color={SECONDARY_FONT_COLORS[colorMode]} />} 
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
