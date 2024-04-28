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
import { NavigationItem } from "./navigation-data";


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
        redirect(`/projects/${newProjectId}/users`);
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
  navigationItems: NavigationItem[],
}) {
  const { isCompactMediaQuery, onShowSidebar, navigationItems, headerHeight, ...sheetProps } = props;
  const pathname = usePathname();

  const selectedItem = React.useMemo(() => {
    return navigationItems.find((item) => {
      if (item.type === 'label') {
        return false;
      }
      return item.regex.test(pathname);
    });
  }, [pathname, navigationItems]);

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
            {selectedItem ? (
              typeof selectedItem.name === 'string' ? (
                <Typography level="title-md">{selectedItem.name}</Typography>
              ) : selectedItem.name.map((name, index) => (
                <Typography key={name} level="title-md">{name}</Typography>
              ))
            ) : null}
            
          </Breadcrumbs>
        </Stack>
      </Stack>
    </Sheet>
  );
}
