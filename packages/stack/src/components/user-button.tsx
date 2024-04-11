'use client';
import React from "react";
import { useUser, Text, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "..";
import { RxPerson, RxEnter } from "react-icons/rx";
import { useRouter } from "next/navigation";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";

function Item(props: { text: string, icon: React.ReactNode, href?: string, onClick?: () => void }) {
  const router = useRouter();
  return (
    <DropdownMenuItem 
      onClick={props.onClick || (() => router.push(props.href || ''))}
      style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
    >
      {props.icon}
      <Text>{props.text}</Text>
    </DropdownMenuItem>
  );
}

export default function UserButton() {
  const user = useUser();
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem', height: 40 }}>
          <img src={user.profileImageUrl || ''} style={{ borderRadius: 100, height: '100%' }} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <img src={user.profileImageUrl || ''} style={{ borderRadius: 100, height: 40, width: 40 }} />
            <div>
              <Text>{user.displayName}</Text>
              <Text variant="secondary" size="sm" style={{ fontWeight: 400 }}>{user.primaryEmail}</Text>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Item text="Account settings" href="/profile" icon={<RxPerson size={22} color={'grey'} />} />
        <Item text="Sign Out" onClick={() => runAsynchronously(user.signOut())} icon={<RxEnter size={22} color={'grey'} />} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}