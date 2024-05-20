'use client';;
import Link from "next/link";
import {
  Book,
  KeyRound,
  LockKeyhole,
  LucideIcon,
  Mail,
  Menu,
  Settings,
  Settings2,
  ShieldEllipsis,
  User,
  Users,
} from "lucide-react";
import { Link as LinkIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Project, UserButton, useUser } from "@stackframe/stack";
import { usePathname } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ProjectSwitcher } from "@/components/project-switcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Typography from "@/components/ui/typography";
import { useTheme } from "next-themes";

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
    href: "/auth-methods",
    regex: /^\/projects\/[^\/]+\/auth-methods$/,
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
    name: ["Teams", "Members"],
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
    name: "Team Settings",
    href: "/team-settings",
    regex: /^\/projects\/[^\/]+\/team-settings$/,
    icon: Settings2,
    type: 'item'
  },
  {
    name: "Configuration",
    type: 'label'
  },
  {
    name: "Domains & Handlers",
    href: "/domains",
    regex: /^\/projects\/[^\/]+\/domains$/,
    icon: LinkIcon,
    type: 'item'
  },
  {
    name: "Emails",
    href: "/emails",
    regex: /^\/projects\/[^\/]+\/emails$/,
    icon: Mail,
    type: 'item'
  },
  {
    name: "API Keys",
    href: "/api-keys",
    regex: /^\/projects\/[^\/]+\/api-keys$/,
    icon: KeyRound,
    type: 'item'
  },
  {
    name: "Project Settings",
    href: "/project-settings",
    regex: /^\/projects\/[^\/]+\/project-settings$/,
    icon: Settings,
    type: 'item'
  }
];

export function NavItem({ item, href, onClick }: { item: Item, href: string, onClick?: () => void}) {
  const pathname = usePathname();
  const selected = useMemo(() => {
    return item.regex.test(pathname);
  }, [item.regex, pathname]);
  
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: 'ghost', size: "sm" }),
        selected && "bg-muted",
        "flex-grow justify-start text-md text-zinc-800 dark:text-zinc-300 px-2",
      )}
      onClick={onClick}
    >
      <item.icon className="mr-2 h-4 w-4" />
      {item.name}
    </Link>
  );
}

export function SidebarContent({ projectId, onNavigate }: { projectId: string, onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full items-stretch">
      <div className="h-14 border-b flex items-center px-2 shrink-0">
        <ProjectSwitcher currentProjectId={projectId} />
      </div>
      <div className="flex flex-grow flex-col gap-1 pt-2 overflow-y-auto">
        {navigationItems.map((item, index) => {
          if (item.type === 'label') {
            return <Typography key={index} className="pl-2 mt-3" type="label" variant="secondary">
              {item.name}
            </Typography>;
          } else if (item.type === 'item') {
            return <div key={index} className="flex px-2">
              <NavItem item={item} onClick={onNavigate} href={`/projects/${projectId}${item.href}`}/>
            </div>;
          }
        })}

        <div className="flex-grow"/>

        <div className="py-2 px-2 flex">
          <NavItem
            onClick={onNavigate}
            item={{
              name: "Documentation",
              type: "item",
              href: "",
              icon: Book,
              regex: /^$/,
            }}
            href={"https://docs.stack-auth.com/"}
          />
        </div>
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
            index < selectedItemNames.length - 1 ?
              <Fragment key={index}>
                <BreadcrumbItem>{name}</BreadcrumbItem>
                <BreadcrumbSeparator/>
              </Fragment> :
              <BreadcrumbPage key={index}>{name}</BreadcrumbPage>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }
}

export default function SidebarLayout(props: { projectId: string, children?: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="w-full flex">
      <div className="flex-col border-r w-[240px] h-screen sticky top-0 hidden md:flex">
        <SidebarContent projectId={props.projectId} />
      </div>
      <div className="flex-grow w-0">
        <div className="h-14 border-b flex items-center justify-between sticky top-0 bg-white dark:bg-black z-10 px-4 md:px-6">
          <div className="hidden md:flex">
            <HeaderBreadcrumb projectId={props.projectId} />
          </div>

          <div className="flex md:hidden items-center">
            <Sheet onOpenChange={(open) => setSidebarOpen(open)} open={sidebarOpen}>
              <SheetTrigger>
                <Menu />
              </SheetTrigger>
              <SheetContent side='left' className="w-[240px] p-0" hasCloseButton={false}>
                <SidebarContent projectId={props.projectId} onNavigate={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="ml-4 flex md:hidden">
              <HeaderBreadcrumb projectId={props.projectId} mobile />
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" size='sm' onClick={() => { window.open("mailto:team@stack-auth.com"); }}>
              Feedback
            </Button>
            <UserButton colorModeToggle={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')} />
          </div>
        </div>
        <div className="py-4 px-4 md:px-6">
          {props.children}
        </div>
      </div>
    </div>
  );
}
