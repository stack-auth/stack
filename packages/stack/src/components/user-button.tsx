'use client';

import React, { Suspense } from "react";
import {
  useUser,
  Text,
  useStackApp,
  Skeleton,
  CurrentUser,
} from "..";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import UserAvatar from "./user-avatar";
import { useRouter } from "next/navigation";
import { CircleUser, LogIn, SunMoon, UserPlus, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

function Item(props: { text: string, icon: React.ReactNode, onClick: () => void | Promise<void> }) {
  return (
    <DropdownMenuItem 
      onClick={() => runAsynchronouslyWithAlert(props.onClick)}
      className="flex gap-2 items-center"
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
  
  const iconProps = { size: 20, className: 'h-4 w-4' };
  const textClasses = 'text-ellipsis whitespace-nowrap overflow-hidden';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none stack-scope">
        <div className="flex gap-2 items-center">
          <UserAvatar user={user} />
          {user && props.showUserInfo && 
            <div className="flex flex-col justify-center">
              <Text className={textClasses}>{user.displayName}</Text>
              <Text className={textClasses} variant="secondary" size="sm">{user.primaryEmail}</Text>
            </div>
          }
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="stack-scope">
        <DropdownMenuLabel>
          <div className="flex gap-2 items-center">
            <UserAvatar user={user} />
            <div>
              {user && <Text>{user.displayName}</Text>}
              {user && <Text variant="secondary" size="sm">{user.primaryEmail}</Text>}
              {!user && <Text>Not signed in</Text>}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user && <Item 
          text="Account settings" 
          onClick={() => router.push(app.urls.accountSettings)}
          icon={<CircleUser {...iconProps} />}
        />}
        {!user && <Item
          text="Sign in"
          onClick={() => router.push(app.urls.signIn)}
          icon={<LogIn {...iconProps} />}
        />}
        {!user && <Item
          text="Sign up"
          onClick={() => router.push(app.urls.signUp)}
          icon={<UserPlus {...iconProps}/> }
        />}
        {user && props.extraItems && props.extraItems.map((item, index) => (
          <Item key={index} {...item} />
        ))}
        {props.colorModeToggle && (
          <Item 
            text="Toggle theme" 
            onClick={props.colorModeToggle} 
            icon={<SunMoon {...iconProps} />}
          />
        )}
        {user && <Item 
          text="Sign out" 
          onClick={() => user.signOut()} 
          icon={<LogOut {...iconProps} />}
        />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
