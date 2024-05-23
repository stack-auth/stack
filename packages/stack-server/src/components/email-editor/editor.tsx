import { useEffect } from 'react';
import { setDocument } from './documents/editor/editor-context';
import InspectorDrawer from './inspector-drawer';
import TemplatePanel from './template-panel';
import { TEditorConfiguration } from './documents/editor/core';

export default function EmailEditor(props: { document: TEditorConfiguration }) {
  useEffect(() => {
    setDocument(props.document);
  }, [props.document]);

  return (
    <div className='flex flex-row h-full'>
      <div className='flex grow'>
        <TemplatePanel />
      </div>
      <InspectorDrawer />
    </div>
  );
}
