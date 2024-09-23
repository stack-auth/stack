'use client';

import { Button, Typography, cn } from '@stackframe/stack-ui';
import { LucideIcon, XIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import React, { ReactNode } from 'react';

export type SidebarItem = {
  title: React.ReactNode,
  type: 'item' | 'divider',
  description?: React.ReactNode,
  subpath?: string,
  icon?: LucideIcon,
  content?: React.ReactNode,
  contentTitle?: React.ReactNode,
}

export function SidebarLayout(props: { items: SidebarItem[], title?: ReactNode, basePath: string, className?: string }) {
  const pathname = usePathname();
  const selectedIndex = props.items.findIndex(item => item.subpath && (props.basePath + item.subpath === pathname));
  const router = useRouter();
  if (pathname !== props.basePath && selectedIndex === -1) {
    router.push(props.basePath);
  }

  return (
    <>
      <div className={cn("hidden sm:flex stack-scope h-full", props.className)}>
        <DesktopLayout items={props.items} title={props.title} selectedIndex={selectedIndex} basePath={props.basePath} />
      </div>
      <div className={cn("sm:hidden stack-scope h-full", props.className)}>
        <MobileLayout items={props.items} title={props.title} selectedIndex={selectedIndex} basePath={props.basePath} />
      </div>
    </>
  );
}

function Items(props: { items: SidebarItem[], basePath: string, selectedIndex: number }) {
  const router = useRouter();

  return props.items.map((item, index) => (
    item.type === 'item' ?
      <Button
        key={index}
        variant='ghost'
        size='sm'
        className={cn(
          props.selectedIndex === index && "bg-muted",
          "justify-start text-md text-zinc-800 dark:text-zinc-300 px-2",
        )}
        onClick={() => {
          if (item.subpath) {
            router.push(props.basePath + item.subpath);
          }
        }}
      >
        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
        {item.title}
      </Button> :
      <Typography key={index}>
        {item.title}
      </Typography>
  ));

}

function DesktopLayout(props: { items: SidebarItem[], title?: ReactNode, selectedIndex: number, basePath: string }) {
  const selectedItem = props.items[props.selectedIndex === -1 ? 0 : props.selectedIndex];

  return (
    <div className="stack-scope flex w-full h-full max-w-full relative">
      <div className="flex max-w-[200px] min-w-[200px] border-r flex-col items-stretch gap-2 p-2 overflow-y-auto">
        {props.title && <div className='mb-2 ml-2'>
          <Typography type='h2' className="text-lg font-semibold text-zinc-800 dark:text-zinc-300">{props.title}</Typography>
        </div>}

        <Items items={props.items} basePath={props.basePath} selectedIndex={props.selectedIndex} />
      </div>
      <div className="ml-[200px] flex-1 w-0 flex justify-center gap-4 py-2 px-4">
        <div className='flex flex-col max-w-[800px] w-[800px]'>
          <div className='mt-4 mb-6'>
            <Typography type='h4' className='font-semibold'>{selectedItem.title}</Typography>
            {selectedItem.description && <Typography variant='secondary' type='label'>{selectedItem.description}</Typography>}
          </div>
          <div className='flex-1'>
            {selectedItem.content}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileLayout(props: { items: SidebarItem[], title?: ReactNode, selectedIndex: number, basePath: string }) {
  const selectedItem = props.items[props.selectedIndex];
  const router = useRouter();

  if (props.selectedIndex === -1) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {props.title && <div className='mb-2 ml-2'>
          <Typography type='h2' className="text-lg font-semibold text-zinc-800 dark:text-zinc-300">{props.title}</Typography>
        </div>}

        <Items items={props.items} basePath={props.basePath} selectedIndex={props.selectedIndex} />
      </div>
    );
  } else {
    return (
      <div className="flex-1 flex flex-col gap-4 py-2 px-4">
        <div className='flex flex-col'>
          <div className='flex justify-between'>
            <Typography type='h4' className='font-semibold'>{selectedItem.title}</Typography>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => { router.push(props.basePath); }}
            >
              <XIcon className='h-5 w-5' />
            </Button>
          </div>
          {selectedItem.description && <Typography variant='secondary' type='label'>{selectedItem.description}</Typography>}
        </div>
        <div className='flex-1'>
          {selectedItem.content}
        </div>
      </div>
    );
  }
}