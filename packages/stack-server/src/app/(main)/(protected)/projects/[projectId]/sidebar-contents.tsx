'use client';
import * as React from 'react';
import NextLink from 'next/link';
import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import Typography from '@mui/joy/Typography';
import { useAdminApp } from './useAdminInterface';
import { usePathname } from 'next/navigation';
import { useUser } from 'stack';
import { Dropdown, MenuButton, MenuItem, Menu, useColorScheme, Stack, Link } from '@mui/joy';
import { Icon } from '@/components/icon';
import { AsyncButton } from '@/components/async-button';
import { Logo } from '@/components/logo';


function SidebarItem({
  title,
  icon,
  href,
}: {
  title: string,
  icon: React.ReactNode,
  href: string,
}) {
  const pathname = usePathname();
  const selected = React.useMemo(() => {
    return pathname === new URL(href, "https://example.com").pathname;
  }, [href, pathname]);
  
  return (
    <ListItem
      sx={{
        '--ListItem-radius': (theme) => theme.vars.radius.sm,
      }}
    >
      <ListItemButton
        selected={selected}
        href={href}
        component={NextLink}
        sx={{
          "&.Mui-selected": {
            backgroundColor: "background.level1",
          },
        }}
      >
        {icon}
        <ListItemContent>
          <Typography level="title-md">{title}</Typography>
        </ListItemContent>
      </ListItemButton>
    </ListItem>
  );
}

function AvatarSection() {
  const { mode, setMode } = useColorScheme();
  const user = useUser({ or: 'redirect' });
  const nameStyle = { 
    textOverflow: 'ellipsis', 
    whiteSpace: 'nowrap', 
    overflow: 'hidden'
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Avatar
        variant="outlined"
        size="sm"
        src={user.profileImageUrl || undefined}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography level="title-sm" sx={nameStyle}>{user.displayName || user.primaryEmail}</Typography>
        {user.displayName ? <Typography level="body-xs" sx={nameStyle}>{user.primaryEmail}</Typography> : null}
      </Box>
      <Dropdown>
        <MenuButton size="sm" variant="plain" color="neutral">
          <Icon icon="more_vert" />
          <Menu sx={{ zIndex: 10001 }}>
            <MenuItem>
              <Button onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} variant='plain' sx={{ width: '100%'}}>
                {mode === 'dark' ? <Icon icon="light_mode" sx={{ mr: 1 }}/> : <Icon icon="dark_mode" sx={{ mr: 1 }}/>}
                {mode === 'dark' ? 'Light mode' : 'Dark mode'}
              </Button>
            </MenuItem>
            <MenuItem>
              <AsyncButton onClick={() => user.signOut()} variant='plain' sx={{ w: '100%'}}>
                <Icon icon="logout" sx={{ mr: 1 }} />
                Sign out
              </AsyncButton>
            </MenuItem>
          </Menu>
        </MenuButton>
      </Dropdown>
    </Box>
  );
}

export function SidebarContents({ headerHeight } : { headerHeight: number }) {
  const stackAdminApp = useAdminApp();
  const basePath = `/projects/${stackAdminApp.projectId}`;
  return (
    <Stack
      sx={{
        height: '100dvh',
        top: 0,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* <SidebarHeader /> */}

      <Stack sx={{ marginLeft: 2, justifyContent: 'center', height: headerHeight - 1 }}>
        <Logo full height={24} href="/projects" />
      </Stack>

      <Divider sx={{ mb: 1 }} />

      <Stack sx={{ px: 1, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Box
          sx={{
            minHeight: 0,
            overflow: 'hidden auto',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <List
            size="sm"
            sx={{ gap: 0.25 }}
          >
            <SidebarItem title="Dashboard" icon={<Icon icon="grid_view" />} href={basePath} />
            <SidebarItem title="Users" icon={<Icon icon="people_outline" />} href={`${basePath}/auth/users`} />
            <SidebarItem title="Providers" icon={<Icon icon="device_hub" />} href={`${basePath}/auth/providers`} />
            <SidebarItem title="Domains & Handlers" icon={<Icon icon="link" />} href={`${basePath}/auth/urls-and-callbacks`} />
            <SidebarItem title="Environment" icon={<Icon icon="list_alt" />} href={`${basePath}/settings/environment`} />
            <SidebarItem title="API Keys" icon={<Icon icon="key" />} href={`${basePath}/settings/api-keys`} />
          </List>

          <Button size="sm" variant="solid">
          Upgrade plan
          </Button>
        </Box>

        <Divider sx={{ mt: 1 }} />
      
        <Box sx={{ py: 1 }}>
          <AvatarSection />
        </Box>
      </Stack>
    </Stack>
  );
}
