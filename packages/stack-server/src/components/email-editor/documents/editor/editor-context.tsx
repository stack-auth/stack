import { create } from 'zustand';
import { TEditorConfiguration } from './core';
import EMPTY_EMAIL_MESSAGE from '../../get-configuration/sample/empty-email-message';

type TValue = {
  document: TEditorConfiguration,

  selectedBlockId: string | null,
  selectedSidebarTab: 'configuration' | 'settings' | 'variables',
  selectedMainTab: 'editor' | 'preview',
  selectedScreenSize: 'desktop' | 'mobile',

  inspectorDrawerOpen: boolean,
  variablesDrawerOpen: boolean,
};

const editorStateStore = create<TValue>(() => ({
  document: EMPTY_EMAIL_MESSAGE,

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

export function useSelectedBlockId() {
  return editorStateStore((s) => s.selectedBlockId);
}

export function useSelectedScreenSize() {
  return editorStateStore((s) => s.selectedScreenSize);
}

export function useSelectedMainTab() {
  return editorStateStore((s) => s.selectedMainTab);
}

export function setSelectedMainTab(selectedMainTab: TValue['selectedMainTab']) {
  return editorStateStore.setState({ selectedMainTab });
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
