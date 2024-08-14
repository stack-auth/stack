'use client';

import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { ShieldEllipsis, User, Users } from "lucide-react";

const navigationItems: SidebarItem[] = [
  {
    name: "Users",
    type: "label",
  },
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
    name: "Teams",
    type: "label",
  },
  {
    name: "Teams",
    href: "/teams",
    icon: Users,
    type: "item",
  },
];

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <SidebarLayout items={navigationItems}>
      {props.children}
    </SidebarLayout>
  );
}