'use client';
import React from "react";
import { Popover, PopoverTrigger, PopoverContent, useUser, Text, Divider, useDesign, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "..";
import { RxPerson, RxEnter } from "react-icons/rx";
import { useRouter } from "next/navigation";

function Item({ text, icon, href }: { text: string, icon: React.ReactNode, href: string }) {
  const router = useRouter();
  return (
    <DropdownMenuItem onClick={() => router.push(href)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      {icon}
      <Text>{text}</Text>
    </DropdownMenuItem>
  );
}


export default function UserButton() {
  const user = useUser();
  if (!user) return null;

  // return (
  //   <Popover>
  //     <PopoverTrigger>
  //       <div style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0.25rem' }}>
  //         <img src={user.profileImageUrl || ''} style={{ borderRadius: 100, height: '100%' }} />
  //       </div>
  //     </PopoverTrigger>
  //     <PopoverContent>
  //       <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  //         <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
  //           <img src={user.profileImageUrl || ''} style={{ borderRadius: 100, height: 40, width: 40 }} />
  //           <div>
  //             <Text>{user.displayName}</Text>
  //             <Text variant="secondary" size="sm">{user.primaryEmail}</Text>
  //           </div>
  //         </div>
  //         <Divider />
  //         <div style={{ display: 'flex', flexDirection: 'column'}}>
  //           <PopoverItem text="Account settings" href="/profile" icon={<RxPerson size={22} color={'grey'}/>} />
  //           <PopoverItem text="Sign Out" href="/logout" icon={<RxEnter size={22} color={'grey'}/>} />
  //         </div>
  //       </div>
  //     </PopoverContent>
  //   </Popover>
  // );
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
        <Item text="Sign Out" href="/logout" icon={<RxEnter size={22} color={'grey'} />} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}