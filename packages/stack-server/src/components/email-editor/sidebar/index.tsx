import { Tab, Tabs } from '@mui/material';
import { setSidebarTab, useInspectorDrawerOpen, useSelectedSidebarTab } from '../documents/editor/editor-context';
import ConfigurationPanel from './configuration-panel';
import SettingsPanel from './settings-panel';
import { cn } from '@/lib/utils';
import VariablesPanel from './variables-panel';
import { Button } from '@/components/ui/button';

export default function InspectorDrawer() {
  const inspectorDrawerOpen = useInspectorDrawerOpen();
  const selectedSidebarTab = useSelectedSidebarTab();

  const renderCurrentSidebarPanel = () => {
    switch (selectedSidebarTab) {
      case 'configuration': {
        return <ConfigurationPanel />;
      }
      case 'settings': {
        return <SettingsPanel />;
      }
      case 'variables': {
        return <VariablesPanel />;
      }
    }
  };

  return (
    <div className={cn('w-[260px] flex flex-col border-l', inspectorDrawerOpen ? '' : 'hidden')}>
      <div className="h-[49px] border-b">
        <div className="px-2">
          <Tabs value={selectedSidebarTab} onChange={(_, v) => setSidebarTab(v)}>
            <Tab value="variables" label="Variables" />
            <Tab value="configuration" label="Inspect" />
            <Tab value="settings" label="Settings" />
          </Tabs>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        {renderCurrentSidebarPanel()}
      </div>
      <div className='flex gap-2 p-2 border-t'>
        <Button variant='secondary' className='flex-1'>Cancel</Button>
        <Button className='flex-1'>Save</Button>
      </div>
    </div>
  );
}
