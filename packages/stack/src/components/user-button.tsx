'use client';

import React, { Suspense } from "react";
import {
  useUser,
  useStackApp,
  CurrentUser,
} from "..";
import { runAsynchronouslyWithAlert } from "@stackframe/stack-shared/dist/utils/promises";
import { UserAvatar } from "./elements/user-avatar";
import { CircleUser, LogIn, SunMoon, UserPlus, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Skeleton, Typography } from "@stackframe/stack-ui";

function Item(props: { text: string, icon: React.ReactNode, onClick: () => void | Promise<void> }) {
  return (
    <DropdownMenuItem onClick={() => runAsynchronouslyWithAlert(props.onClick)}>
      <div className="flex gap-2 items-center">
        {props.icon}
        <Typography>{props.text}</Typography>
      </div>
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

export function UserButton(props: UserButtonProps) {
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

  const iconProps = { size: 20, className: 'h-4 w-4' };
  const textClasses = 'text-ellipsis whitespace-nowrap overflow-hidden';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none stack-scope">
        <div className="flex gap-2 items-center">
          <UserAvatar user={user} />
          {user && props.showUserInfo &&
            <div className="flex flex-col justify-center">
              <Typography className={textClasses}>{user.displayName}</Typography>
              <Typography className={textClasses} variant="secondary" type='label'>{user.primaryEmail}</Typography>
            </div>
          }
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="stack-scope">
        <DropdownMenuLabel>
          <div className="flex gap-2 items-center">
            <UserAvatar user={user} />
            <div>
              {user && <Typography>{user.displayName}</Typography>}
              {user && <Typography variant="secondary" type='label'>{user.primaryEmail}</Typography>}
              {!user && <Typography>Not signed in</Typography>}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user && <Item
          text="Account settings"
          onClick={async () => await app.redirectToAccountSettings()}
          icon={<CircleUser {...iconProps} />}
        />}
        {!user && <Item
          text="Sign in"
          onClick={async () => await app.redirectToSignIn()}
          icon={<LogIn {...iconProps} />}
        />}
        {!user && <Item
          text="Sign up"
          onClick={async () => await app.redirectToSignUp()}
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
