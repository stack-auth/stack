'use client';

import React from 'react';
import { Tabs as DefaultTabs, TabsList as DefaultTabsList, TabsTrigger as DefaultTabsTrigger, TabsContent as DefaultTabsContent } from "../components-core";
import { Tabs as JoyTabs, TabList as JoyTabsList, Tab as JoyTabsTrigger, TabPanel as JoyTabssContent } from '@mui/joy';

export const Tabs = React.forwardRef<
  React.ElementRef<typeof DefaultTabs>,
  React.ComponentProps<typeof DefaultTabs>
>((props, ref) => {
  const { color, onChange, ref: _, ...validProps } = props; // TODO: add onChange
  return <JoyTabs ref={ref} {...validProps}/>;
});

export const TabsList = React.forwardRef<
  React.ElementRef<typeof DefaultTabsList>,
  React.ComponentProps<typeof DefaultTabsList>
>((props, ref) => {
  const { color, ref: _, ...validProps } = props;
  return <JoyTabsList ref={ref} {...validProps}/>;
});

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof DefaultTabsTrigger>,
  React.ComponentProps<typeof DefaultTabsTrigger>
>((props, ref) => {
  const { style, color, onChange, ref: _, ...validProps } = props; // TODO: add onChange
  return <JoyTabsTrigger ref={ref} {...validProps} style={{ flexGrow: 1, ...style }}/>;
});

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof DefaultTabsContent>,
  React.ComponentProps<typeof DefaultTabsContent>
>((props, ref) => {
  const { color, ref: _, ...validProps } = props;
  return <JoyTabssContent ref={ref} {...validProps}/>;
});
