import React from 'react';

import { CodeOutlined, DataObjectOutlined, EditOutlined, PreviewOutlined } from '@mui/icons-material';
import { Tab, Tabs, Tooltip } from '@mui/material';

import { setSelectedMainTab, useSelectedMainTab } from '../documents/editor/EditorContext';

export default function MainTabsGroup() {
  const selectedMainTab = useSelectedMainTab();
  const handleChange = (_: unknown, v: unknown) => {
    switch (v) {
      case 'preview':
      case 'editor': {
        setSelectedMainTab(v);
        return;
      }
      default: {
        setSelectedMainTab('editor');
      }
    }
  };

  return (
    <Tabs value={selectedMainTab} onChange={handleChange}>
      <Tab
        value="editor"
        label={
          <Tooltip title="Edit">
            <EditOutlined fontSize="small" />
          </Tooltip>
        }
      />
      <Tab
        value="preview"
        label={
          <Tooltip title="Preview">
            <PreviewOutlined fontSize="small" />
          </Tooltip>
        }
      />
    </Tabs>
  );
}
