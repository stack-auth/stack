'use client';

import { useState } from 'react';
import { TEditorBlock } from '../../../../editor/core';
import BlocksPopover from './blocks-menu';
import { Button } from '@/components/ui/button';
import { CirclePlus } from 'lucide-react';

type Props = {
  placeholder?: boolean,
  onSelect: (block: TEditorBlock) => void,
};
export default function AddBlockButton({ onSelect, placeholder }: Props) {
  const renderButton = () => {
    if (placeholder) {
      return (
        <Button
          onClick={(ev) => { ev.stopPropagation(); }}
          className="flex items-center justify-center h-12 w-full"
          variant='outline'
        >
          <CirclePlus className="h-5 w-5 text-black" />
        </Button>
      );
    } else {
      return (
        <button
          className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 p-1 rounded-full z-10 bg-white shadow"
          onClick={(ev) => { ev.stopPropagation(); }}
        >
          <CirclePlus className="h-5 w-5" />
        </button>
      );
    }
  };

  return (
    <div className='relative'>
      <BlocksPopover
        trigger={renderButton()}
        onSelect={onSelect} 
      />
    </div>
  );
}
