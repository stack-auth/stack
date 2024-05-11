'use client';;
import Link from "next/link";
import {
  Book,
  ChevronDownIcon,
  Globe,
  KeyRound,
  LockKeyhole,
  LucideIcon,
  Menu,
  Settings2,
  ShieldEllipsis,
  User,
  Users,
} from "lucide-react";
import { Link as LinkIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Project, UserButton, useUser } from "@stackframe/stack";
import { useColorScheme } from "@mui/joy";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ProjectSwitcher } from "@/components/project-switcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Typography from "@/components/ui/typography";

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
    regex: /^\/projects\/[^\/]+\/users$/,
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

export function NavItem({ item, projectId, onClick }: { item: Item, projectId: string, onClick?: () => void}) {
  const pathname = usePathname();
  const selected = useMemo(() => {
    return item.regex.test(pathname);
  }, [item.regex, pathname]);
  
  return (
    <Link
      href={`/projects/${projectId}${item.href}`}
      className={cn(
        buttonVariants({ variant: 'ghost', size: "default" }),
        selected && "bg-muted",
        "flex-grow justify-start text-md text-zinc-800 dark:text-zinc-300"
      )}
      onClick={onClick}
    >
      <item.icon className="mr-2 h-4 w-4" />
      {item.name}
    </Link>
  );
}

export function SidebarContent({ projectId, onNavigate }: { projectId: string, onNavigate?: () => void }) {
  const { mode, setMode } = useColorScheme();

  return (
    <div className="flex flex-col h-full items-stretch">
      <div className="h-14 border-b flex items-center px-2">
        <ProjectSwitcher currentProjectId={projectId} />
      </div>
      <div className="flex flex-col gap-1 pt-2">
        {navigationItems.map((item, index) => {
          if (item.type === 'label') {
            return <Typography key={index} className="pl-2" type="label" variant="secondary">
              {item.name}
            </Typography>;
          } else if (item.type === 'item') {
            return <div key={index} className="flex px-1">
              <NavItem item={item} projectId={projectId} onClick={onNavigate} />
            </div>;
          }
        })}
      </div>
      
      <div className="flex-grow"/>

      <div className="py-2 px-1 flex">
        <NavItem
          onClick={onNavigate}
          item={{
            name: "Documentation",
            type: "item",
            href: "/search",
            icon: Book,
            regex: /^$/,
          }}
          projectId={projectId}
        />
      </div>
      <Separator />
      {/* <div className="m-2 p-2 border rounded-md self-stretch"> */}
      <div className="px-2 flex items-center">
        <UserButton showUserInfo colorModeToggle={() => setMode(mode === 'light' ? 'dark' : 'light')} />
      </div>
    </div>
  );
}

export function HeaderBreadcrumb({ 
  mobile,
  projectId 
}: { 
  projectId: string, 
  mobile?: boolean,
}) {
  const pathname = usePathname();
  const user = useUser({ or: 'redirect', projectIdMustMatch: "internal" });
  const projects = user.useOwnedProjects();

  const selectedItemNames: string[] = useMemo(() => {
    const name = navigationItems.find((item) => {
      if (item.type === 'label') {
        return false;
      } else {
        return item.regex.test(pathname);
      }
    })?.name;

    if (!name) {
      return [];
    } else if (name instanceof Array) {
      return name;
    } else {
      return [name];
    }
  }, [pathname]);

  const selectedProject: Project | undefined = useMemo(() => {
    return projects.find((project) => project.id === projectId);
  }, [projectId, projects]);

  if (mobile) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/projects">Home</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1">
                <BreadcrumbEllipsis />
                <ChevronDownIcon className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <Link href={`/projects/${projectId}`}>{selectedProject?.displayName}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {selectedItemNames.map((name, index) => (
                    <BreadcrumbItem key={index}>
                      <BreadcrumbPage>{name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  ))}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  } else {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/projects">Home</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href={`/projects/${projectId}`}>{selectedProject?.displayName}</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {selectedItemNames.map((name, index) => (
            <BreadcrumbItem key={index}>
              <BreadcrumbPage>{name}</BreadcrumbPage>
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }
}

export default function SidebarLayout(props: { projectId: string, children?: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="w-full flex">
      <div className="flex-col border-r w-[240px] h-screen sticky top-0 hidden md:flex">
        <SidebarContent projectId={props.projectId} />
      </div>
      <div className="flex-grow w-0">
        <div className="h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-white dark:bg-black z-10">
          <div className="hidden md:flex">
            <HeaderBreadcrumb projectId={props.projectId} />
          </div>

          <div className="flex md:hidden items-center">
            <Sheet onOpenChange={(open) => setSidebarOpen(open)} open={sidebarOpen}>
              <SheetTrigger>
                <Button variant="outline" className="p-2 md:hidden">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className="w-[240px] p-0" hasCloseButton={false}>
                <SidebarContent projectId={props.projectId} onNavigate={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="ml-4 flex md:hidden">
              <HeaderBreadcrumb projectId={props.projectId} mobile />
            </div>
          </div>

          <Button variant="outline" onClick={() => window.open("mailto:team@stack-auth.com")}>
            Feedback
          </Button>
        </div>
        <div className="px-4">
          {props.children}
        </div>
      </div>
    </div>
  );
}