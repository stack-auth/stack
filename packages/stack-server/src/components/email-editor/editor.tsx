import React from 'react';

import { Box, Stack, useTheme } from '@mui/material';

import { useInspectorDrawerOpen, useSamplesDrawerOpen } from './documents/editor/EditorContext';

import InspectorDrawer from './InspectorDrawer';
import SamplesDrawer from './SamplesDrawer';
import TemplatePanel from './TemplatePanel';

function useDrawerTransition(cssProperty: 'margin-left' | 'margin-right', open: boolean) {
  const { transitions } = useTheme();
  return transitions.create(cssProperty, {
    easing: !open ? transitions.easing.sharp : transitions.easing.easeOut,
    duration: !open ? transitions.duration.leavingScreen : transitions.duration.enteringScreen,
  });
}

export default function EmailEditor() {
  return (
    <>
      <SamplesDrawer />

      <div className='flex flex-row h-full'>
        <div className='flex grow'>
          <TemplatePanel />
        </div>
        <InspectorDrawer />
      </div>
    </>
  );
}
