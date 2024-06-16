import { TEditorBlock } from '../../../editor/core';
import { resetDocument, useDocument } from '../../../editor/editor-context';
import { ColumnsContainerProps } from '../../columns-container/columns-container-props-schema';
import { Trash2 } from 'lucide-react';

const STYLE = "";

type Props = {
  blockId: string,
};

export default function TuneMenu({ blockId }: Props) {
  const document = useDocument();

  const handleDeleteClick = () => {
    const filterChildrenIds = (childrenIds: string[] | null | undefined) => {
      if (!childrenIds) {
        return childrenIds;
      }
      return childrenIds.filter((f) => f !== blockId);
    };
    const nDocument: typeof document = { ...document };
    for (const [id, b] of Object.entries(nDocument)) {
      const block = b as TEditorBlock;
      if (id === blockId) {
        continue;
      }
      switch (block.type) {
        case 'EmailLayout': {
          nDocument[id] = {
            ...block,
            data: {
              ...block.data,
              childrenIds: filterChildrenIds(block.data.childrenIds),
            },
          };
          break;
        }
        case 'Container': {
          nDocument[id] = {
            ...block,
            data: {
              ...block.data,
              props: {
                ...block.data.props,
                childrenIds: filterChildrenIds(block.data.props?.childrenIds),
              },
            },
          };
          break;
        }
        case 'ColumnsContainer': {
          nDocument[id] = {
            type: 'ColumnsContainer',
            data: {
              style: block.data.style,
              props: {
                ...block.data.props,
                columns: block.data.props?.columns.map((c) => ({
                  childrenIds: filterChildrenIds(c.childrenIds),
                })),
              },
            } as ColumnsContainerProps,
          };
          break;
        }
        default: {
          nDocument[id] = block;
        }
      }
    }
    delete nDocument[blockId];
    resetDocument(nDocument);
  };

  return (
    <button
      className="bg-white shadow-md absolute top-0 right-0 rounded-full min-h-8 min-w-8 flex items-center justify-center"
      onClick={handleDeleteClick}
    >
      <Trash2 className='w-5 h-5' />
    </button>
  );
}
