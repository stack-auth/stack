'use client';

import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { SelectedTeamSwitcher, useUser } from "@stackframe/stack";
import { ShieldEllipsis, User, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

const navigationItems: SidebarItem[] = [
  {
    name: "Users",
    href: "/users",
    icon: User,
    type: "item",
  },
  {
    name: "Auth Methods",
    href: "/auth-methods",
    icon: ShieldEllipsis,
    type: "item",
  },
  {
    type: 'separator'
  },
  {
    name: "Teams",
    href: "/teams",
    icon: Users,
    type: "item",
  },
];

export default function Layout(props: { children: React.ReactNode }) {
  const params = useParams<{ teamId: string }>();
  const user = useUser({ or: 'redirect' });
  const team = user.useTeam(params.teamId);
  const router = useRouter();

  if (!team) {
    router.push('/dashboard');
    return null;
  }

  return (
    <SidebarLayout 
      items={navigationItems}
      sidebarTop={<SelectedTeamSwitcher 
        selectedTeam={team}
        urlMap={(team) => `/dashboard/${team.id}`}
      />}
    >
      {props.children}
    </SidebarLayout>
  );
}