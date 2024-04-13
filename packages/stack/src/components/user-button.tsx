'use client';
import React from "react";
import { useUser, Text, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, useStackApp, useDesign, Avatar, AvatarImage, AvatarFallback } from "..";
import { RxPerson, RxEnter } from "react-icons/rx";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { SECONDARY_FONT_COLORS } from "../utils/constants";
import UserAvatar from "./user-avatar";

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

export default function UserButton() {
  const user = useUser();
  const app = useStackApp();
  const { colorMode } = useDesign();
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserAvatar/>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
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
        <Item text="Account settings" onClick={() => app.redirectToAccountSettings()} icon={<RxPerson size={22} color={'grey'} />} />
        <Item text="Sign out" onClick={() => user.signOut()} icon={<RxEnter size={22} color={SECONDARY_FONT_COLORS[colorMode]} />} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}