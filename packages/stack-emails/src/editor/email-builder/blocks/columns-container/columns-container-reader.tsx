import React from 'react';
import { ColumnsContainer as BaseColumnsContainer } from '../../../blocks/block-columns-container';
import { ReaderBlock } from '../../reader/core';
import { ColumnsContainerProps } from './columns-container-props-schema';
import { TEditorConfiguration } from '@stackframe/stack-emails/dist/editor/documents/editor/core';

export default function ColumnsContainerReader({ style, props, document }: ColumnsContainerProps & { document?: TEditorConfiguration }) {
  const { columns, ...restProps } = props ?? {};
  let cols = undefined;
  if (columns) {
    cols = columns.map((col) => col.childrenIds.map((childId) => <ReaderBlock key={childId} id={childId} document={document} />));
  }

  return <BaseColumnsContainer props={restProps} columns={cols} style={style} />;
}
