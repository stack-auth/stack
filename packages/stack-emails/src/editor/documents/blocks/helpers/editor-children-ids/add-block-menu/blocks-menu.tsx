import React from 'react';
import { TEditorBlock } from '../../../../editor/core';
import BlockButton from './block-button';
import { BUTTONS } from './buttons';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../../../components/ui/popover';

type BlocksMenuProps = {
  trigger: React.ReactNode,
  onSelect: (block: TEditorBlock) => void,
};
export default function BlocksPopover({ trigger, onSelect }: BlocksMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className='w-[300px] md:w-[600px]'>
        <div className='grid grid-cols-2 gap-2 md:grid-cols-4'>
          {BUTTONS.map((k, i) => (
            <BlockButton key={i} label={k.label} icon={k.icon} onClick={() => onSelect(k.block())} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
