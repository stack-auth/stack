import { Box, Tab, Tabs } from '@mui/material';

import { setSidebarTab, useSelectedSidebarTab } from '../documents/editor/EditorContext';

import ConfigurationPanel from './ConfigurationPanel';
import StylesPanel from './StylesPanel';

export const INSPECTOR_DRAWER_WIDTH = 260;

export default function InspectorDrawer() {
  const selectedSidebarTab = useSelectedSidebarTab();

  const renderCurrentSidebarPanel = () => {
    switch (selectedSidebarTab) {
      case 'block-configuration': {
        return <ConfigurationPanel />;
      }
      case 'styles': {
        return <StylesPanel />;
      }
    }
  };

  return (
    <Box sx={{ width: INSPECTOR_DRAWER_WIDTH }}>
      <Box sx={{ width: INSPECTOR_DRAWER_WIDTH, height: 49, borderBottom: 1, borderColor: 'divider' }}>
        <Box px={2}>
          <Tabs value={selectedSidebarTab} onChange={(_, v) => setSidebarTab(v)}>
            <Tab value="styles" label="Styles" />
            <Tab value="block-configuration" label="Inspect" />
          </Tabs>
        </Box>
      </Box>
      <Box sx={{ width: INSPECTOR_DRAWER_WIDTH, height: 'calc(100% - 49px)', overflow: 'auto' }}>
        {renderCurrentSidebarPanel()}
      </Box>
    </Box>
  );
}
