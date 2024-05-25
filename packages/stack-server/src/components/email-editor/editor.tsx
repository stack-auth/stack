import { useEffect, useMemo } from 'react';
import { setDocument, useDocument } from './documents/editor/editor-context';
import InspectorDrawer from './sidebar';
import TemplatePanel from './template-panel';
import { TEditorConfiguration } from './documents/editor/core';
import _ from 'lodash';
import { confirmAlertMessage, useDisableRouter } from '@/components/router';

export default function EmailEditor(props: { 
  document: TEditorConfiguration, 
  onSave?: (document: TEditorConfiguration) => void | Promise<void>,
  onCancel?: () => void | Promise<void>,
}) {
  const document = useDocument();
  const { setDisabled } = useDisableRouter();

  useEffect(() => {
    setDocument(props.document);
  }, [props.document]);

  const edited = useMemo(() => {
    return !_.isEqual(props.document, document);
  }, [props.document, document]);

  useEffect(() => {
    setDisabled(edited);
    return () => setDisabled(false);
  }, [edited, setDisabled]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (edited) {
        e.returnValue = confirmAlertMessage;
        return confirmAlertMessage;
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [edited]);

  return (
    <div className='flex flex-row h-full'>
      <div className='flex grow'>
        <TemplatePanel />
      </div>
      <InspectorDrawer onSave={props.onSave} onCancel={props.onCancel} edited={edited} />
    </div>
  );
}
