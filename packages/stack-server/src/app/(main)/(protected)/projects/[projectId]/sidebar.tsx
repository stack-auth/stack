'use client';;
import * as React from 'react';
import NextLink from 'next/link';
import Box from '@mui/joy/Box';
import Divider from '@mui/joy/Divider';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import Typography from '@mui/joy/Typography';
import { useAdminApp } from './use-admin-app';
import { usePathname } from 'next/navigation';
import { UserButton } from '@stackframe/stack';
import { Stack, Sheet } from '@mui/joy';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { NavigationItem } from './navigation-data';


function SidebarItem({
  title,
  icon,
  href,
  target,
}: {
  title: string,
  icon: React.ReactNode,
  href: string,
  target?: string,
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
        target={target}
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
        {target === "_blank" ? <Icon icon="open_in_new" /> : null}
      </ListItemButton>
    </ListItem>
  );
}

export function Sidebar(props: { 
  isCompactMediaQuery: string,
  headerHeight: number, 
  navigationItems: NavigationItem[],
  mode: 'compact' | 'full',
}) {
  const stackAdminApp = useAdminApp();
  const basePath = `/projects/${stackAdminApp.projectId}`;

  const { headerHeight, navigationItems, ...sheetProps} = props;
  return (
    <Sheet
      variant="outlined"        
      sx={props.mode === 'full' ? {
        position: 'sticky',
        top: 0,
        height: `100vh`,
        [props.isCompactMediaQuery]: {
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
        [props.isCompactMediaQuery]: { display: 'none' },
      } : {}}>
      <Stack
        sx={{
          height: '100dvh',
          top: 0,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack sx={{ marginLeft: 2, justifyContent: 'center', height: headerHeight - 1 }}>
          <Logo full height={24} href="/projects" />
        </Stack>

        <Divider sx={{ mb: 1 }} />

        <Stack sx={{ px: 1, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <Box
            sx={{
              minHeight: 0,
              overflow: 'hidden auto',
              display: 'flex',
              flexGrow: 1,
              flexDirection: 'column',
            }}
          >
            <List size="sm" sx={{ gap: 0.25  }}>
              {navigationItems.map((item) => (
                item.type === 'item' ? 
                  <SidebarItem 
                    key={item.name + '-item'}
                    title={item.name} 
                    icon={item.icon} 
                    href={basePath + item.href}
                  /> : 
                  item.type === 'label' ?
                    <Typography 
                      key={item.name + '-label'}
                      level="title-sm" 
                      color="neutral"
                      sx={{ my: 1 }}
                    >
                      {item.name}
                    </Typography> : null
              ))}
              <Box style={{ flexGrow: 1 }}/>
              <SidebarItem
                title='Documentation'
                icon={<Icon icon="help_outline" />}
                href={process.env.NEXT_PUBLIC_DOC_URL || ''}
                target="_blank"
              />
            </List>
          </Box>

          <Divider sx={{ mt: 1 }} />
      
          <Box sx={{ py: 1 }}>
            <UserButton showUserInfo />
          </Box>
        </Stack>
      </Stack>
    </Sheet>
  );
}
