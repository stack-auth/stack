import { useMemo } from 'react';
import { MonitorOutlined, PhoneIphoneOutlined } from '@mui/icons-material';
import { Box, SxProps, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { Reader } from '../email-builder';
import EditorBlock from '../documents/editor/editor-block';
import {
  setSelectedScreenSize,
  useDocument,
  useSelectedMainTab,
  useSelectedScreenSize,
} from '../documents/editor/editor-context';
import ToggleInspectorPanelButton from '../sidebar/toggle-inspector-panel-button';
import MainTabsGroup from './main-tabs-group';
import { objectStringMap } from '../utils';
import Mustache from 'mustache';

const VARS = {'name': 'John Doe', 'email': 'random@email.com'} as Record<string, string>;

function MergedReader() {
  const document = useDocument();

  const mergedDocument = useMemo(() => {
    return objectStringMap(document, (str) => {
      return Mustache.render(str, VARS);
    });
  }, [document]);

  return <Reader document={mergedDocument} rootBlockId="root" />;
}

export default function TemplatePanel() {
  const selectedMainTab = useSelectedMainTab();
  const selectedScreenSize = useSelectedScreenSize();

  let mainBoxSx: SxProps = {
    height: '100%',
  };
  if (selectedScreenSize === 'mobile') {
    mainBoxSx = {
      ...mainBoxSx,
      margin: '32px auto',
      width: 370,
      height: 800,
      boxShadow:
        'rgba(33, 36, 67, 0.04) 0px 10px 20px, rgba(33, 36, 67, 0.04) 0px 2px 6px, rgba(33, 36, 67, 0.04) 0px 0px 1px',
    };
  }

  const handleScreenSizeChange = (_: unknown, value: unknown) => {
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

  const renderMainPanel = () => {
    switch (selectedMainTab) {
      case 'editor': {
        return (
          <Box sx={mainBoxSx}>
            <EditorBlock id="root" />
          </Box>
        );
      }
      case 'preview': {
        return (
          <Box sx={mainBoxSx}>
            <MergedReader />
          </Box>
        );
      }
    }
  };

  return (
    <div className='flex flex-col w-full h-full'>
      <div className="flex flex-row justify-between items-center h-[49px] border-b border-divider bg-white sticky top-0 px-1">
        <div className="flex flex-row gap-2 w-full justify-between items-center">
          <div className="flex flex-row space-x-2 items-center">
            <MainTabsGroup />
          </div>
          <div className="flex flex-row space-x-2">
            <ToggleButtonGroup value={selectedScreenSize} exclusive size="small" onChange={handleScreenSizeChange}>
              <ToggleButton value="desktop">
                <Tooltip title="Desktop view">
                  <MonitorOutlined fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="mobile">
                <Tooltip title="Mobile view">
                  <PhoneIphoneOutlined fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>
        <ToggleInspectorPanelButton />
      </div>
      <div className='flex-grow overflow-auto'>
        {renderMainPanel()}
      </div>
    </div>

  );
}
