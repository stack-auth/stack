import EditorBlock from '../documents/editor/editor-block';
import { setSelectedScreenSize, useSelectedScreenSize } from '../documents/editor/editor-context';
import ToggleInspectorPanelButton from '../sidebar/toggle-inspector-panel-button';
import { SimpleTooltip } from '../../components/simple-tooltip';
import { Monitor, Smartphone } from 'lucide-react';
import { TabsList, Tabs, TabsTrigger } from '../../components/ui/tabs';

export default function TemplatePanel() {
  const selectedScreenSize = useSelectedScreenSize();

  let mainBoxClasses = 'h-full';
  let mainBoxStyles = {};

  if (selectedScreenSize === 'mobile') {
    mainBoxClasses = 'mx-auto shadow';
    mainBoxStyles = {
      marginTop: '32px',
      width: '370px',
      height: '800px',
    };
  }

  const handleScreenSizeChange = (value: 'mobile' | 'desktop') => {
    switch (value) {
      case 'mobile':
      case 'desktop': {
        setSelectedScreenSize(value);
        return;
      }
      default: {
        setSelectedScreenSize('desktop');
      }
    }
  };

  return (
    <div className='flex flex-col w-full h-full'>
      <div className="flex flex-row justify-between items-center h-12 min-h-12 border-b border-divider bg-white dark:bg-black sticky top-0 px-2">
        <div className="flex flex-row gap-2 w-full justify-between items-center">
          <div className="flex flex-row space-x-2">
            <Tabs value={selectedScreenSize}>
              <TabsList>
                <TabsTrigger value='desktop' onClick={() => handleScreenSizeChange('desktop')}>
                  <SimpleTooltip tooltip="Desktop view">
                    <Monitor className='w-5 h-5' />
                  </SimpleTooltip>
                </TabsTrigger>

                <TabsTrigger value='mobile' onClick={() => handleScreenSizeChange('mobile')}>
                  <SimpleTooltip tooltip="Mobile view">
                    <Smartphone className='w-5 h-5' />
                  </SimpleTooltip>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <ToggleInspectorPanelButton />
      </div>
      <div className='flex-grow overflow-auto'>
        <div className={`${mainBoxClasses}`} style={mainBoxStyles}>
          <EditorBlock id="root" />
        </div>
      </div>
    </div>
  );
}
