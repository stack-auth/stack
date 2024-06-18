import React from 'react';

import { BaseZodDictionary, BlockConfiguration, DocumentBlocksDictionary } from '..';
import { TEditorConfiguration } from '../../documents/editor/core';

/**
 * @param blocks Main DocumentBlocksDictionary
 * @returns React component that can render a BlockConfiguration that is compatible with blocks
 */
export default function buildBlockComponent<T extends BaseZodDictionary>(blocks: DocumentBlocksDictionary<T>) {
  return function BlockComponent({ type, data, document }: BlockConfiguration<T> & { document: TEditorConfiguration }) {
    const Component = blocks[type].Component;
    return <Component {...data} document={document} />;
  };
}
