import { Button } from '@stackframe/stack-ui';
import React from 'react';

type BlockMenuButtonProps = {
  label: string,
  icon: React.ReactNode,
  onClick: () => void,
};

export default function BlockTypeButton({ label, icon, onClick }: BlockMenuButtonProps) {
  return (
    <Button
      variant='outline'
      onClick={(ev) => {
        ev.stopPropagation();
        onClick();
      }}
      className='flex items-center gap-2'
    >
      {icon}
      <div className='flex justify-center flex-grow'>
        {label}
      </div>
    </Button>
  );
}
