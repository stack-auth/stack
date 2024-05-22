import { useEffect } from 'react';
import { useTheme } from '@mui/material';
import { setDocument } from './documents/editor/EditorContext';
import InspectorDrawer from './InspectorDrawer';
import TemplatePanel from './TemplatePanel';
import { TEditorConfiguration } from './documents/editor/core';

export default function EmailEditor(props: { document: TEditorConfiguration }) {
  useEffect(() => {
    setDocument(props.document);
  }, [props.document]);

  return (
    <>
      <div className='flex flex-row h-full'>
        <div className='flex grow'>
          <TemplatePanel />
        </div>
        <InspectorDrawer />
      </div>
    </>
  );
}
