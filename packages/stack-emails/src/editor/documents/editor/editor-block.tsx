'use client';

import React, { createContext, useContext, useMemo } from 'react';

import { EditorBlock as CoreEditorBlock } from './core';
import { useDocument, useMetadata } from './editor-context';
import { convertEmailTemplateVariables } from '@stackframe/stack-emails/dist/utils';

const EditorBlockContext = createContext<string | null>(null);
export const useCurrentBlockId = () => useContext(EditorBlockContext)!;

type EditorBlockProps = {
  id: string,
};

/**
 *
 * @param id - Block id
 * @returns EditorBlock component that loads data from the EditorDocumentContext
 */
export default function EditorBlock({ id }: EditorBlockProps) {
  const document = useDocument();
  const metadata = useMetadata();
  
  const mergedDocument = useMemo(() => {
    return convertEmailTemplateVariables(document, metadata.variables);
  }, [document, metadata]);

  const block = mergedDocument[id];
  // eslint-disable-next-line
  if (!block) {
    throw new Error('Could not find block');
  }
  return (
    <EditorBlockContext.Provider value={id}>
      <CoreEditorBlock {...block} document={document} />
    </EditorBlockContext.Provider>
  );
}
