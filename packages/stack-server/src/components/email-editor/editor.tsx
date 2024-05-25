import { useEffect, useMemo } from 'react';
import { setDocument, useDocument } from './documents/editor/editor-context';
import InspectorDrawer from './sidebar';
import TemplatePanel from './template-panel';
import { TEditorConfiguration } from './documents/editor/core';
import _ from 'lodash';

export default function EmailEditor(props: { 
  document: TEditorConfiguration, 
  onSave?: (document: TEditorConfiguration) => void | Promise<void>,
  onCancel?: () => void | Promise<void>,
}) {
  const document = useDocument();
  useEffect(() => {
    setDocument(props.document);
  }, [props.document]);

  const edited = useMemo(() => {
    return !_.isEqual(props.document, document);
  }, [props.document, document]);

  return (
    <div className='flex flex-row h-full'>
      <div className='flex grow'>
        <TemplatePanel />
      </div>
      <InspectorDrawer onSave={props.onSave} onCancel={props.onCancel} edited={edited} />
    </div>
  );
}
