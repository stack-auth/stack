'use client';

import { Button, Typography, cn } from '@stackframe/stack-ui';
import { LucideIcon } from 'lucide-react';
import React, { ReactNode } from 'react';

type Item = {
  title: React.ReactNode,
  description?: React.ReactNode,
  icon?: LucideIcon,
  content: React.ReactNode,
}

export function SidebarNavItem(props: { item: Item, selected: boolean, onClick: () => void }) {
  return (
    <Button
      variant='ghost'
      size='sm'
      className={cn(
        props.selected && "bg-muted",
        "justify-start text-md text-zinc-800 dark:text-zinc-300 px-2",
      )}
      onClick={props.onClick}
    >
      {props.item.icon && <props.item.icon className="mr-2 h-4 w-4" />}
      {props.item.title}
    </Button>
  );
}

export function SidebarLayout(props: { items: Item[], title?: ReactNode }) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const currentItem = props.items[selectedIndex];

  return (
    <div className="stack-scope flex">
      <div className="flex w-[200px] border-r flex-col items-stretch gap-2 p-2">
        {props.title && <div className='mb-2'>
          <Typography type='h2' className="text-lg font-semibold text-zinc-800 dark:text-zinc-300">{props.title}</Typography>
        </div>}

        {props.items.map((item, index) => (
          <SidebarNavItem
            key={index}
            item={item}
            onClick={() => setSelectedIndex(index)}
            selected={index === selectedIndex}
          />
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-4 py-2 px-4">
        <div>
          <Typography type='h4'>{currentItem.title}</Typography>
          {currentItem.description && <Typography variant='secondary' type='label'>{currentItem.description}</Typography>}
        </div>
        <div className='flex-1'>
          {currentItem.content}
        </div>
      </div>
    </div>
  );
}