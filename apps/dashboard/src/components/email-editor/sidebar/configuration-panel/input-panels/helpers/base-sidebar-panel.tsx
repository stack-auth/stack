import React from 'react';
import { SimpleTooltip } from '@/components/simple-tooltip';
import Typography from '@/components/ui/typography';

type SidebarPanelProps = {
  title: string,
  children: React.ReactNode,
  tooltip?: string,
};
export default function BaseSidebarPanel({ title, children, tooltip }: SidebarPanelProps) {
  return (
    <div className='py-2 px-4'>
      <div className='flex items-center mb-6 gap-2'>
        <Typography variant='secondary' className='font-medium'>
          {title}
        </Typography>
        {tooltip && <SimpleTooltip tooltip={tooltip} type='info'/>}
      </div>
      <div className='flex flex-col gap-6 mb-3'>
        {children}
      </div>
    </div>
  );
}
