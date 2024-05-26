import { useEffect, useMemo } from 'react';
import { setDocument, setMetadata, useDocument } from './documents/editor/editor-context';
import InspectorDrawer from './sidebar';
import TemplatePanel from './template-panel';
import { TEditorConfiguration } from './documents/editor/core';
import _ from 'lodash';
import { confirmAlertMessage, useRouterConfirm } from '@/components/router';
import { EmailTemplateMetadata, convertEmailTemplateMetadataExampleValues } from '@/email/utils';
import { useAdminApp } from '@/app/(main)/(protected)/projects/[projectId]/use-admin-app';

export default function EmailEditor(props: { 
  document: TEditorConfiguration, 
  metadata: EmailTemplateMetadata,
  onSave?: (document: TEditorConfiguration) => void | Promise<void>,
  onCancel?: () => void | Promise<void>,
}) {
  const document = useDocument();
  const project = useAdminApp().useProjectAdmin();
  const { setNeedConfirm } = useRouterConfirm();

  useEffect(() => {
    setDocument(props.document);
    setMetadata(convertEmailTemplateMetadataExampleValues(props.metadata, project));
  }, [props.document, props.metadata, project]);

  const edited = useMemo(() => {
    return !_.isEqual(props.document, document);
  }, [props.document, document]);

  useEffect(() => {
    setNeedConfirm(edited);
    return () => setNeedConfirm(false);
  }, [edited, setNeedConfirm]);

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
