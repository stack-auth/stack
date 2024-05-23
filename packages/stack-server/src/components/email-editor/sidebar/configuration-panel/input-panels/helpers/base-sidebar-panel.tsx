import React from 'react';

import { Typography } from '@mui/material';
import { SimpleTooltip } from '@/components/simple-tooltip';

type SidebarPanelProps = {
  title: string,
  children: React.ReactNode,
  tooltip?: string,
};
export default function BaseSidebarPanel({ title, children, tooltip }: SidebarPanelProps) {
  return (
    <div className='py-2 px-4'>
      <div className='flex items-center mb-2 gap-2'>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        {tooltip && <SimpleTooltip tooltip={tooltip} type='info'/>}
      </div>
      <div className='flex flex-col space-y-5 mb-3'>
        {children}
      </div>
    </div>
  );
}
