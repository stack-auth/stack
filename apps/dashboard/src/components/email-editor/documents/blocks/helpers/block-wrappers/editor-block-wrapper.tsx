'use client';

import React, { CSSProperties, useState } from 'react';
import { useCurrentBlockId } from '../../../editor/editor-block';
import { setSelectedBlockId, useSelectedBlockId } from '../../../editor/editor-context';

import TuneMenu from './tune-menu';

type TEditorBlockWrapperProps = {
  children: JSX.Element,
};

export default function EditorBlockWrapper({ children }: TEditorBlockWrapperProps) {
  const selectedBlockId = useSelectedBlockId();
  const [mouseInside, setMouseInside] = useState(false);
  const blockId = useCurrentBlockId();

  let outline: CSSProperties['outline'];
  if (selectedBlockId === blockId) {
    outline = '2px solid rgba(0,121,204, 1)';
  } else if (mouseInside) {
    outline = '2px solid rgba(0,121,204, 0.3)';
  }

  const renderMenu = () => {
    if (selectedBlockId !== blockId) {
      return null;
    }
    return <TuneMenu blockId={blockId} />;
  };

  return (
    <div
      className="relative max-w-full"
      style={{
        outlineOffset: '-1px',
        outline,
      }}
      onMouseEnter={(ev) => {
        setMouseInside(true);
        ev.stopPropagation();
      }}
      onMouseLeave={() => {
        setMouseInside(false);
      }}
      onClick={(ev) => {
        setSelectedBlockId(blockId);
        ev.stopPropagation();
        ev.preventDefault();
      }}
    >
      {renderMenu()}
      {children}
    </div>
  );
}
