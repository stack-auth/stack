import React from 'react';
import { CirclePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  onClick: () => void,
};
export default function PlaceholderButton({ onClick }: Props) {
  return (
    <Button
      onClick={(ev) => {
        ev.stopPropagation();
        onClick();
      }}
      className="flex items-center justify-center h-12 w-full"
      variant='outline'
    >
      <CirclePlus className="h-5 w-5 text-black" />
    </Button>
  );
}
