"use client";

import { Drawer, Stack, useTheme } from "@mui/joy";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Icon } from '@/components/icon';

const navigationItems = [
  {
    name: "Users",
    href: "/auth/users",
    icon: <Icon icon="people_outline" />,
  },
  {
    name: "Providers",
    href: "/auth/providers",
    icon: <Icon icon="device_hub" />,
  },
  {
    name: "Domains & Handlers",
    href: "/auth/urls-and-callbacks",
    icon: <Icon icon="link" />,
  },
  {
    name: "Environment",
    href: "/settings/environment",
    icon: <Icon icon="list_alt" />,
  },
  {
    name: "API Keys",
    href: "/settings/api-keys",
    icon: <Icon icon="key" />,
  },
];


export default function SidebarLayout(props: { children: React.ReactNode, params: { projectId: string } }) {
  const theme = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isCompactMediaQuery = theme.breakpoints.down("md");

  const headerHeight = 50;

  return (
    <>
      <Stack
        flexGrow={1}
        direction="row"
        alignItems="flex-start"
      >
        <Sidebar
          isCompactMediaQuery={isCompactMediaQuery}
          headerHeight={headerHeight}
          navigationItems={navigationItems}
          mode='full'
        />
        <Stack flexGrow={1} direction="column" sx={{ overflow: 'hidden', height: '100vh' }}>
          <Header
            headerHeight={headerHeight}
            navigationItems={navigationItems}
            isCompactMediaQuery={isCompactMediaQuery}
            onShowSidebar={() => setIsSidebarOpen(true)}
          />
          <Stack
            paddingX={{ md: 4, xs: 2 }}
            flexGrow={1}
            paddingY={2}
            minWidth={0}
            overflow='auto'
          >
            <Stack spacing={2} component="main">
              {props.children}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
      <Drawer
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      >
        <Sidebar
          isCompactMediaQuery={isCompactMediaQuery}
          headerHeight={headerHeight}
          navigationItems={navigationItems}
          mode='compact'
        />
      </Drawer>
    </>
  );
}
