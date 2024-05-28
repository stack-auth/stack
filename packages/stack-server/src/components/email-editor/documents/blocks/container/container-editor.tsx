import React from 'react';

import { Container as BaseContainer } from '../../../blocks/block-container';

import { useCurrentBlockId } from '../../editor/editor-block';
import { setDocument, setSelectedBlockId, useDocument } from '../../editor/editor-context';
import EditorChildrenIds from '../helpers/editor-children-ids';

import { ContainerProps } from './container-props-schema';

export default function ContainerEditor({ style, props }: ContainerProps) {
  const childrenIds = props?.childrenIds ?? [];

  const document = useDocument();
  const currentBlockId = useCurrentBlockId();

  return (
    <BaseContainer style={style}>
      <EditorChildrenIds
        childrenIds={childrenIds}
        onChange={({ block, blockId, childrenIds }) => {
          setDocument({
            [blockId]: block,
            [currentBlockId]: {
              type: 'Container',
              data: {
                ...document[currentBlockId].data,
                props: { childrenIds: childrenIds },
              },
            },
          });
          setSelectedBlockId(blockId);
        }}
      />
    </BaseContainer>
  );
}
