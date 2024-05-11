'use client';

import Link from "next/link";
import {
  Book,
  Globe,
  KeyRound,
  LockKeyhole,
  LucideIcon,
  Settings2,
  ShieldEllipsis,
  User,
  Users,
} from "lucide-react";
import { Search, Link as LinkIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserButton } from "@stackframe/stack";
import { useColorScheme } from "@mui/joy";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type Label = {
  name: string,
  type: 'label',
};

type Item = {
  name: string,
  href: string,
  icon: LucideIcon,
  regex: RegExp,
  type: 'item',
};

type Hidden = {
  name: string | string[],
  regex: RegExp,
  type: 'hidden',
};

const navigationItems: (Label | Item | Hidden)[] = [
  {
    name: "Users",
    type: 'label'
  },
  {
    name: "Users",
    href: "/users",
    regex: /^\/projects\/[^\/]+\/user\/[^\/]+$/,
    icon: User,
    type: 'item'
  },
  {
    name: "Auth Methods",
    href: "/providers",
    regex: /^\/projects\/[^\/]+\/providers$/,
    icon: ShieldEllipsis,
    type: 'item'
  },
  {
    name: "Teams",
    type: 'label'
  },
  {
    name: "Teams",
    href: "/teams",
    regex: /^\/projects\/[^\/]+\/teams$/,
    icon: Users,
    type: 'item'
  },
  {
    name: ["Team", "Members"],
    regex: /^\/projects\/[^\/]+\/teams\/[^\/]+$/,
    type: "hidden",
  },
  {
    name: "Permissions",
    href: "/team-permissions",
    regex: /^\/projects\/[^\/]+\/team-permissions$/,
    icon: LockKeyhole,
    type: 'item'
  },
  {
    name: "Settings",
    type: 'label'
  },
  {
    name: "Domains & Handlers",
    href: "/urls-and-callbacks",
    regex: /^\/projects\/[^\/]+\/urls-and-callbacks$/,
    icon: LinkIcon,
    type: 'item'
  },
  {
    name: "Team Settings",
    href: "/team-settings",
    regex: /^\/projects\/[^\/]+\/team-settings$/,
    icon: Settings2,
    type: 'item'
  },
  {
    name: "Environment",
    href: "/environment",
    regex: /^\/projects\/[^\/]+\/environment$/,
    icon: Globe,
    type: 'item'
  },
  {
    name: "API Keys",
    href: "/api-keys",
    regex: /^\/projects\/[^\/]+\/api-keys$/,
    icon: KeyRound,
    type: 'item'
  },
];

export function NavItem(props: Item) {
  const pathname = usePathname();
  const selected = useMemo(() => {
    return props.regex.test(pathname);
  }, [props.regex, pathname]);
  
  return (
    <Link
      href={props.href}
      className={cn(
        buttonVariants({ variant: selected ? 'default' : 'ghost', size: "default" }),
        selected && "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white w-full",
        "flex-grow justify-start",
      )}
    >
      <props.icon className="mr-2 h-4 w-4" />
      {props.name}
    </Link>
  );
}

export function SidebarContent() {
  const { mode, setMode } = useColorScheme();

  return (
    <div className="flex flex-col h-full items-stretch">
      {navigationItems.map((item, index) => {
        if (item.type === 'label') {
          return <div key={index} className="pl-2 pt-2 pb-1 text-sm text-gray-500">
            {item.name}
          </div>;
        } else if (item.type === 'item') {
          return <div key={index} className="px-2 flex">
            <NavItem {...item as Item} />
          </div>;
        }
      })}
      
      <div className="flex-grow"/>

      <div className="p-2 flex">
        <NavItem
          type="item"
          name="Documentation"
          href="/search"
          icon={Book}
          regex={/^$/}
        />
      </div>
      <Separator />
      <div className="m-2 p-2 border rounded-md self-stretch">
        <UserButton showUserInfo colorModeToggle={() => setMode(mode === 'light' ? 'dark' : 'light')} />
      </div>
    </div>
  );
}

export default function SidebarLayout(props: { children?: React.ReactNode }) {
  return (
    <div className="w-full flex">
      <div className="flex-col border-r w-[240px] h-screen sticky hidden md:flex">
        <SidebarContent />
      </div>
      {props.children}
    </div>
  );
}