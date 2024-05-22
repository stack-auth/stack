import { Box, Tab, Tabs } from '@mui/material';

import { setSidebarTab, useInspectorDrawerOpen, useSelectedSidebarTab } from '../documents/editor/EditorContext';

import ConfigurationPanel from './ConfigurationPanel';
import StylesPanel from './StylesPanel';
import { cn } from '@/lib/utils';

export default function InspectorDrawer() {
  const inspectorDrawerOpen = useInspectorDrawerOpen();
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
    <div className={cn('w-[260px] h-full', inspectorDrawerOpen ? '' : 'hidden')}>
      <Box sx={{ height: 49, borderBottom: 1, borderColor: 'divider' }}>
        <Box px={2}>
          <Tabs value={selectedSidebarTab} onChange={(_, v) => setSidebarTab(v)}>
            <Tab value="styles" label="Styles" />
            <Tab value="block-configuration" label="Inspect" />
          </Tabs>
        </Box>
      </Box>
      <Box sx={{ height: 'calc(100% - 49px)', overflow: 'auto' }}>
        {renderCurrentSidebarPanel()}
      </Box>
    </div>
  );
}
