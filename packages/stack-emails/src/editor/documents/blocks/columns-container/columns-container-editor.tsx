import React from 'react';
import { ColumnsContainer as BaseColumnsContainer } from '../../../blocks/block-columns-container';
import { useCurrentBlockId } from '../../editor/editor-block';
import { setDocument, setSelectedBlockId } from '../../editor/editor-context';
import EditorChildrenIds, { EditorChildrenChange } from '../helpers/editor-children-ids';
import ColumnsContainerPropsSchema, { ColumnsContainerProps } from './columns-container-props-schema';

const EMPTY_COLUMNS = [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }];

export default function ColumnsContainerEditor({ style, props }: ColumnsContainerProps) {
  const currentBlockId = useCurrentBlockId();

  const { columns, ...restProps } = props ?? {};
  const columnsValue = columns ?? EMPTY_COLUMNS;

  const updateColumn = (columnIndex: 0 | 1 | 2, { block, blockId, childrenIds }: EditorChildrenChange) => {
    const nColumns = [...columnsValue];
    nColumns[columnIndex] = { childrenIds };
    setDocument({
      [blockId]: block,
      [currentBlockId]: {
        type: 'ColumnsContainer',
        data: ColumnsContainerPropsSchema.parse({
          style,
          props: {
            ...restProps,
            columns: nColumns,
          },
        }),
      },
    });
    setSelectedBlockId(blockId);
  };

  return (
    <BaseColumnsContainer
      props={restProps}
      style={style}
      columns={[
        <EditorChildrenIds key={0} childrenIds={columns?.[0]?.childrenIds} onChange={(change) => updateColumn(0, change)} />,
        <EditorChildrenIds key={1} childrenIds={columns?.[1]?.childrenIds} onChange={(change) => updateColumn(1, change)} />,
        <EditorChildrenIds key={2} childrenIds={columns?.[2]?.childrenIds} onChange={(change) => updateColumn(2, change)} />,
      ]}
    />
  );
}
