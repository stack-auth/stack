"use client";

import { Box, Divider, Drawer, Stack, useTheme } from "@mui/joy";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Sidebar } from "./sidebar";
import { AdminAppProvider } from "./useAdminInterface";
import { Header } from "./header";

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
            isCompactMediaQuery={isCompactMediaQuery}
            onShowSidebar={() => setIsSidebarOpen(true)}
            sx={{
              height: `${headerHeight}px`,
              flexShrink: 0,
              [isCompactMediaQuery]: {
                display: "flex",
              },
            }}
          />
          <Stack
            paddingX={{
              lg: 6,
              md: 4,
              xs: 2,
            }}
            flexGrow={1}
            paddingY={2}
            minWidth={0}
          >
            <Box
              component="main"
              sx={{ minHeight: "100vh" }}
            >
              {props.children}
            </Box>
            <Divider sx={{ marginY: 4 }} />
            <Stack
              alignItems="center"
              component="footer"
            >
              <Logo full height={30} href="/projects" />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
      <Drawer
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      >
        <Sidebar
          onCloseSidebar={() => setIsSidebarOpen(false)}
          headerHeight={headerHeight}
        />
      </Drawer>
    </AdminAppProvider>
  );
}
