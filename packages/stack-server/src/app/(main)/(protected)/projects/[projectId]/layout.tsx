"use client";

import { Box, Divider, Drawer, Stack, useTheme } from "@mui/joy";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Sidebar } from "./sidebar";
import { AdminAppProvider } from "./useAdminInterface";
import { Header } from "./header";
import { Icon } from '@/components/icon';

const navigationItems = [
  {
    name: "Dashboard",
    href: "",
    icon: <Icon icon="grid_view" />,
  },
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


export default function Layout(props: { children: React.ReactNode, params: { projectId: string } }) {
  const theme = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isCompactMediaQuery = theme.breakpoints.down("md");

  const headerHeight = 50;

  return (
    <AdminAppProvider projectId={props.params.projectId}>
      <Stack
        flexGrow={1}
        direction="row"
        alignItems="flex-start"
      >
        <Sidebar
          headerHeight={headerHeight}
          navigationItems={navigationItems}
          variant="outlined"
          sx={{
            position: 'sticky',
            top: 0,
            height: `100vh`,
            [isCompactMediaQuery]: {
              top: `${headerHeight}px`,
              height: `calc(100vh - ${headerHeight}px)`,
            },
            overflowY: 'auto',
            borderLeft: 'none',
            borderTop: 'none',
            borderBottom: 'none',
            width: '250px',
            flexShrink: 0,
            display: 'block',
            [isCompactMediaQuery]: { display: 'none' },
          }}
        />
        <Stack flexGrow={1} direction="column">
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
          >
            <Box component="main">
              {props.children}
            </Box>
          </Stack>
        </Stack>
      </Stack>
      <Drawer
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      >
        <Sidebar
          // onCloseSidebar={() => setIsSidebarOpen(false)}
          headerHeight={headerHeight}
          navigationItems={navigationItems}
        />
      </Drawer>
    </AdminAppProvider>
  );
}
