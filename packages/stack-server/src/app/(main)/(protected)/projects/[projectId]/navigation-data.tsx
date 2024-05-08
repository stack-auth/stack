import { Icon } from "@/components/icon";

type Label = {
  name: string,
  type: 'label',
};

type Item = {
  name: string,
  href: string,
  icon: JSX.Element,
  regex: RegExp,
  type: 'item',
};

type Hidden = {
  name: string | string[],
  regex: RegExp,
  type: 'hidden',
};

export type NavigationItem = Label | Item | Hidden;

export const navigationItems: (Label | Item | Hidden)[] = [
  {
    name: "Users",
    type: 'label'
  },
  {
    name: "Users",
    href: "/users",
    regex: /^\/projects\/[^\/]+\/user\/[^\/]+$/,
    icon: <Icon icon="person" />,
    type: 'item'
  },
  {
    name: "Auth Methods",
    href: "/providers",
    regex: /^\/projects\/[^\/]+\/providers$/,
    icon: <Icon icon="security" />,
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
    icon: <Icon icon="group" />,
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
    icon: <Icon icon="lock" />,
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
    icon: <Icon icon="link" />,
    type: 'item'
  },
  {
    name: "Team Settings",
    href: "/team-settings",
    regex: /^\/projects\/[^\/]+\/team-settings$/,
    icon: <Icon icon="settings" />,
    type: 'item'
  },
  {
    name: "Environment",
    href: "/environment",
    regex: /^\/projects\/[^\/]+\/environment$/,
    icon: <Icon icon="list_alt" />,
    type: 'item'
  },
  {
    name: "API Keys",
    href: "/api-keys",
    regex: /^\/projects\/[^\/]+\/api-keys$/,
    icon: <Icon icon="key" />,
    type: 'item'
  },
];