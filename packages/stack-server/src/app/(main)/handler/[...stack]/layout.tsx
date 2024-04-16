import React from 'react';
import { Header } from '@/components/header';
import { Box, Stack } from '@mui/joy';

export default function Layout(props: { children: React.ReactNode }) {
  const headerHeight = 50;
  return (
    <Stack direction="column" height='100vh'>
      <Header headerHeight={headerHeight} />
      <Box flexGrow={1}>
        {props.children}
      </Box>
    </Stack>
  );
}