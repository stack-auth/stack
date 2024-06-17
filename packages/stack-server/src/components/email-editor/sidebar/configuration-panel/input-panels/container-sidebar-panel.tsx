import React, { useState } from 'react';

import ContainerPropsSchema, { ContainerProps } from '../../../documents/blocks/container/container-props-schema';

import BaseSidebarPanel from './helpers/base-sidebar-panel';
import MultiStylePropertyPanel from './helpers/style-inputs/multi-style-property-panel';

type ContainerSidebarPanelProps = {
  data: ContainerProps,
  setData: (v: ContainerProps) => void,
};

export default function ContainerSidebarPanel({ data, setData }: ContainerSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const updateData = (d: unknown) => {
    const res = ContainerPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };
  return (
    <BaseSidebarPanel title="Container block">
      <MultiStylePropertyPanel
        names={['backgroundColor', 'borderColor', 'borderRadius', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
