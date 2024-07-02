import { setSidebarTab, useDocument, useInspectorDrawerOpen, useSelectedSidebarTab, useSubject } from '../documents/editor/editor-context';
import ConfigurationPanel from './configuration-panel';
import SettingsPanel from './settings-panel';
import { cn } from '../../utils';
import VariablesPanel from './variables-panel';
import { Button } from '../../components/ui/button';
import { TEditorConfiguration } from '../documents/editor/core';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';

export default function InspectorDrawer(props: {
  edited: boolean,
  onSave?: (document: TEditorConfiguration, subject: string) => void | Promise<void>, 
  onCancel?: () => void | Promise<void>,
}){
  const inspectorDrawerOpen = useInspectorDrawerOpen();
  const selectedSidebarTab = useSelectedSidebarTab();
  const document = useDocument();
  const subject = useSubject();

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

  const onSave = async () => {
    if (props.onSave) {
      await props.onSave(document, subject);
    }
  };

  return (
    <div className={cn('w-[260px] min-w-[260px] flex flex-col border-l', inspectorDrawerOpen ? '' : 'hidden')}>
      <div className="h-12 min-h-12 border-b flex justify-center items-center">
        <Tabs value={selectedSidebarTab}>
          <TabsList>
            <TabsTrigger onClick={() => setSidebarTab('variables')} value='variables'>Variables</TabsTrigger>
            <TabsTrigger onClick={() => setSidebarTab('configuration')} value='configuration'>Inspect</TabsTrigger>
            <TabsTrigger onClick={() => setSidebarTab('settings')} value='settings'>Settings</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-grow overflow-auto">
        {renderCurrentSidebarPanel()}
      </div>
      <div className='flex gap-2 p-2 border-t'>
        <Button variant='secondary' className='flex-1' onClick={props.onCancel}>Cancel</Button>
        <Button className='flex-1' onClick={onSave} disabled={!props.edited}>Save</Button>
      </div>
    </div>
  );
}
