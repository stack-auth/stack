import { Box, Tab, Tabs } from '@mui/material';

import { setSidebarTab, useInspectorDrawerOpen, useSelectedSidebarTab } from '../documents/editor/editor-context';

import ConfigurationPanel from './configuration-panel';
import StylesPanel from './global-styles-panel';
import { cn } from '@/lib/utils';
import VariablesPanel from './variables-panel';

export default function InspectorDrawer() {
  const inspectorDrawerOpen = useInspectorDrawerOpen();
  const selectedSidebarTab = useSelectedSidebarTab();

  const renderCurrentSidebarPanel = () => {
    switch (selectedSidebarTab) {
      case 'block-configuration': {
        return <ConfigurationPanel />;
      }
      case 'global-styles': {
        return <StylesPanel />;
      }
      case 'variables': {
        return <VariablesPanel />;
      }
    }
  };

  return (
    <div className={cn('w-[260px] flex flex-col', inspectorDrawerOpen ? '' : 'hidden')}>
      <Box sx={{ height: 49, borderBottom: 1, borderColor: 'divider' }}>
        <Box px={2}>
          <Tabs value={selectedSidebarTab} onChange={(_, v) => setSidebarTab(v)}>
            <Tab value="variables" label="Variables" />
            <Tab value="block-configuration" label="Inspect" />
            <Tab value="global-styles" label="Global" />
          </Tabs>
        </Box>
      </Box>
      <div className="flex-grow overflow-auto">
        {renderCurrentSidebarPanel()}
      </div>
    </div>
  );
}
