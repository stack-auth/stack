"use client";

import { Sheet, SheetProps, Select, Option, SelectOption, Stack, Typography } from "@mui/joy";
import * as React from 'react';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import { useAdminApp } from './useAdminInterface';
import { redirect } from 'next/navigation';
import { useStrictMemo } from 'stack-shared/src/hooks/use-strict-memo';
import { useStackApp } from 'stack';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';


function ProjectSwitchItem({
  label
}: {
  label: string,
}) {
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
  const stackApp = useStackApp({ projectIdMustMatch: "internal" });
  const stackAdminApp = useAdminApp();
  const projectsPromise = useStrictMemo(() => {
    return stackApp.listOwnedProjects();
  }, []);
  const projects = React.use(projectsPromise);
  const project = projects.find((project) => project.id === stackAdminApp.projectId);

  const renderValue = (option: SelectOption<string> | null) => {
    if (!option || typeof option.label !== 'string') { 
      return null;
    }
  
    return (
      <Box sx={{ py: 0.5 }}>
        <ProjectSwitchItem label={option.label} />
      </Box>
    );
  };

  return (
    <Select
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
        redirect(`/projects/${newProjectId}`);
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
  isCompactMediaQuery: string,
  onShowSidebar: () => void,
}) {
  const { isCompactMediaQuery, onShowSidebar, ...sheetProps } = props;
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
        ...sheetProps.sx ?? {},
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        flexGrow={1}
        gap={2}
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
        <ProjectSwitch />
      </Stack>
    </Sheet>
  );
}
