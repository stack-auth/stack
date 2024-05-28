import { create } from 'zustand';
import { TEditorConfiguration } from './core';
import { EmailTemplateMetadata } from '@/email/utils';
import { emptyEmailTemplate } from '@/email/templates/empty';

type TValue = {
  document: TEditorConfiguration,
  subject: string,

  metadata: EmailTemplateMetadata,

  selectedBlockId: string | null,
  selectedSidebarTab: 'configuration' | 'settings' | 'variables',
  selectedScreenSize: 'desktop' | 'mobile',

  inspectorDrawerOpen: boolean,
  variablesDrawerOpen: boolean,
};

const editorStateStore = create<TValue>(() => ({
  document: emptyEmailTemplate,
  subject: '',

  metadata: {
    label: '',
    description: '',
    defaultSubject: '',
    defaultContent: emptyEmailTemplate,
    variables: [],
  },

  selectedBlockId: null,
  selectedSidebarTab: 'variables',
  selectedMainTab: 'editor',
  selectedScreenSize: 'desktop',

  inspectorDrawerOpen: true,
  variablesDrawerOpen: true,
}));

export function useDocument() {
  return editorStateStore((s) => s.document);
}

export function useSubject() {
  return editorStateStore((s) => s.subject);
}

export function useMetadata() {
  return editorStateStore((s) => s.metadata);
}

export function useSelectedBlockId() {
  return editorStateStore((s) => s.selectedBlockId);
}

export function useSelectedScreenSize() {
  return editorStateStore((s) => s.selectedScreenSize);
}

export function useSelectedSidebarTab() {
  return editorStateStore((s) => s.selectedSidebarTab);
}

export function useInspectorDrawerOpen() {
  return editorStateStore((s) => s.inspectorDrawerOpen);
}

export function useVariablesDrawerOpen() {
  return editorStateStore((s) => s.variablesDrawerOpen);
}

export function setSelectedBlockId(selectedBlockId: TValue['selectedBlockId']) {
  const options: Partial<TValue> = {};
  if (selectedBlockId !== null) {
    options.inspectorDrawerOpen = true;
  }
  if (selectedBlockId !== null) {
    options.selectedSidebarTab = 'configuration';
  }

  return editorStateStore.setState({
    selectedBlockId,
    ...options,
  });
}

export function setSidebarTab(selectedSidebarTab: TValue['selectedSidebarTab']) {
  return editorStateStore.setState({ selectedSidebarTab });
}

export function resetDocument(document: TValue['document']) {
  return editorStateStore.setState({
    document,
    selectedSidebarTab: 'variables',
    selectedBlockId: null,
  });
}

export function setDocument(document: TValue['document']) {
  const originalDocument = editorStateStore.getState().document;
  return editorStateStore.setState({
    document: {
      ...originalDocument,
      ...document,
    },
  });
}

export function setSubject(subject: TValue['subject']) {
  return editorStateStore.setState({ subject });
}

export function setMetadata(metadata: TValue['metadata']) {
  return editorStateStore.setState({ metadata });
}

export function toggleInspectorDrawerOpen() {
  const inspectorDrawerOpen = !editorStateStore.getState().inspectorDrawerOpen;
  return editorStateStore.setState({ inspectorDrawerOpen });
}

export function toggleVariablesDrawerOpen() {
  const variablesDrawerOpen = !editorStateStore.getState().variablesDrawerOpen;
  return editorStateStore.setState({ variablesDrawerOpen });
}

export function setSelectedScreenSize(selectedScreenSize: TValue['selectedScreenSize']) {
  return editorStateStore.setState({ selectedScreenSize });
}
