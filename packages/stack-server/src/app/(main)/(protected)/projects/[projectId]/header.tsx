"use client";

import { Sheet, SheetProps, Select, Option, SelectOption, Stack, Typography } from "@mui/joy";
import * as React from 'react';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import { useAdminApp } from './use-admin-app';
import { redirect, usePathname } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { Icon } from '@/components/icon';
import Breadcrumbs from '@mui/joy/Breadcrumbs';


function ProjectSwitchItem({ label }: { label: string }) {
  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
    }}>
      <Box sx={{ 
        width: 28, 
        height: 28, 
        borderRadius: 'sm',
        bgcolor: 'background.level1', 
        marginRight: 1,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography>
          {label?.slice(0,1)?.toUpperCase()}
        </Typography>
      </Box>
      <Typography level="title-md">{label}</Typography>
    </Box>
  );
}

function ProjectSwitch() {
  const stackAdminApp = useAdminApp();
  const user = useUser({ or: 'redirect', projectIdMustMatch: "internal" });
  const projects = user.useOwnedProjects();
  const project = projects.find((project) => project.id === stackAdminApp.projectId);

  const renderValue = (option: SelectOption<string> | null) => {
    if (!option || typeof option.label !== 'string') { 
      return null;
    }
  
    return (
      <Box>
        <ProjectSwitchItem label={option.label} />
      </Box>
    );
  };

  return (
    <Select
      // indicator={null}
      variant="plain"
      defaultValue={project?.id}
      size="sm"
      slotProps={{
        listbox: {
          sx: {
            zIndex: 10001
          },
        },
      }}
      renderValue={renderValue}
      onChange={(event, newProjectId) => {
        redirect(`/projects/${newProjectId}/auth/users`);
      }}
    >
      {projects.map((projectInfo) => (
        <Option value={projectInfo.id} label={projectInfo.displayName} key={projectInfo.id}>
          <ProjectSwitchItem label={projectInfo.displayName} />
        </Option>
      ))}
    </Select>
  );
}

export function Header(props: SheetProps & {
  headerHeight: number,
  isCompactMediaQuery: string,
  onShowSidebar: () => void,
  navigationItems: { name: string, href: string, icon: React.ReactNode }[],
}) {
  const stackAdminApp = useAdminApp();
  const { isCompactMediaQuery, onShowSidebar, navigationItems, headerHeight, ...sheetProps } = props;
  const basePath = `/projects/${stackAdminApp.projectId}`;
  const pathname = usePathname();

  const selectedItem = React.useMemo(() => {
    return navigationItems.find((item) => {
      return new URL(basePath + item.href, "https://example.com").pathname === pathname;
    });
  }, [pathname, basePath, navigationItems]);

  return (
    <Sheet
      variant="outlined"
      component="header"
      {...sheetProps}
      sx={{
        paddingX: 1,
        position: 'sticky',
        top: 0,
        zIndex: 30,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        display: 'flex',
        alignItems: 'stretch',
        height: `${headerHeight}px`,
        flexShrink: 0,
        ...sheetProps.sx ?? {},
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        flexGrow={1}
      >
        <IconButton
          size="sm"
          variant="outlined"
          onClick={onShowSidebar}
          sx={{
            display: 'none',
            [isCompactMediaQuery]: {
              display: 'flex',
            },
          }}
        >
          <Icon icon="menu" />
        </IconButton>
        <Stack flexDirection="row" alignItems="center">
          <Breadcrumbs aria-label="breadcrumb">
            <ProjectSwitch />
            <Typography level="title-md">{selectedItem?.name}</Typography>
          </Breadcrumbs>
        </Stack>
      </Stack>
    </Sheet>
  );
}
