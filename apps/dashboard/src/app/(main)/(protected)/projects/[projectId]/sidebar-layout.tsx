'use client';

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
import { useAdminApp } from "./use-admin-app";
import { EMAIL_TEMPLATES_METADATA } from "@stackframe/stack-emails/dist/utils";
import { Link } from "@/components/link";

type BreadcrumbItem = { item: React.ReactNode, href: string }

type Label = {
  name: React.ReactNode,
  type: 'label',
};

type Item = {
  name: React.ReactNode,
  href: string,
  icon: LucideIcon,
  regex: RegExp,
  type: 'item',
};

type Hidden = {
  name: BreadcrumbItem[] | ((pathname: string) => BreadcrumbItem[]),
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
    name: (pathname: string) => {
      const match = pathname.match(/^\/projects\/[^\/]+\/teams\/([^\/]+)$/);
      let item;
      let href;
      if (match) {
        item = <TeamMemberBreadcrumbItem key='team-display-name' teamId={match[1]} />;
        href = `/teams/${match[1]}`;
      } else {
        item = "Members";
        href = "";
      }

      return [
        { item: "Teams", href: "/teams" },
        { item, href },
      ];
    },
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
    name: (pathname: string) => {
      const match = pathname.match(/^\/projects\/[^\/]+\/emails\/templates\/([^\/]+)$/);
      let item;
      let href;
      if (match && match[1] in EMAIL_TEMPLATES_METADATA) {
        item = EMAIL_TEMPLATES_METADATA[match[1] as keyof typeof EMAIL_TEMPLATES_METADATA].label;
        href = `/emails/templates/${match[1]}`;
      } else {
        item = "Templates";
        href = "";
      }
      return [
        { item: "Emails", href: "/emails" },
        { item, href },
      ];
    },
    regex: /^\/projects\/[^\/]+\/emails\/templates\/[^\/]+$/,
    type: 'hidden',
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

function TeamMemberBreadcrumbItem(props: { teamId: string }) {
  const stackAdminApp = useAdminApp();
  const team = stackAdminApp.useTeam(props.teamId);

  if (!team) {
    return null;
  } else {
    return team.displayName;
  }
}

function NavItem({ item, href, onClick }: { item: Item, href: string, onClick?: () => void}) {
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
      prefetch={true}
    >
      <item.icon className="mr-2 h-4 w-4" />
      {item.name}
    </Link>
  );
}

function SidebarContent({ projectId, onNavigate }: { projectId: string, onNavigate?: () => void }) {
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

function HeaderBreadcrumb({ 
  mobile,
  projectId 
}: { 
  projectId: string, 
  mobile?: boolean,
}) {
  const pathname = usePathname();
  const user = useUser({ or: 'redirect', projectIdMustMatch: "internal" });
  const projects = user.useOwnedProjects();

  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const item = navigationItems.find((item) => {
      if (item.type === 'label') {
        return false;
      } else {
        return item.regex.test(pathname);
      }
    });
    const name = item?.name;

    let results: BreadcrumbItem[];
    if (!name) {
      results = [];
    } else if (name instanceof Array) {
      results = name;
    } else if (typeof name === 'function') {
      results = name(pathname);
    } else {
      results = [{
        item: name,
        href: (item as any)?.href,
      }];
    }
    return results.map((item) => ({
      item: item.item,
      href: `/projects/${projectId}${item.href}`,
    }));
  }, [pathname, projectId]);

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
          {breadcrumbItems.map((name, index) => (
            index < breadcrumbItems.length - 1 ?
              <Fragment key={index}>
                <BreadcrumbItem>
                  <Link href={name.href}>
                    {name.item}
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator/>
              </Fragment> :
              <BreadcrumbPage key={index}>
                <Link href={name.href}>
                  {name.item}
                </Link>
              </BreadcrumbPage>
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
      <div className="flex flex-col flex-grow w-0">
        <div className="h-14 border-b flex items-center justify-between sticky top-0 bg-white dark:bg-black z-5 px-4 md:px-6">
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
        <div className="flex-grow">
          {props.children}
        </div>
      </div>
    </div>
  );
}
