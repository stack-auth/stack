import React, { useState } from 'react';
import { DividerProps, DividerPropsDefaults, DividerPropsSchema } from '../../../blocks/block-divider';
import BaseSidebarPanel from './helpers/base-sidebar-panel';
import ColorInput from './helpers/inputs/color-input';
import SliderInput from './helpers/inputs/slider-input';
import MultiStylePropertyPanel from './helpers/style-inputs/multi-style-property-panel';
import { MoveVertical } from 'lucide-react';

type DividerSidebarPanelProps = {
  data: DividerProps,
  setData: (v: DividerProps) => void,
};
export default function DividerSidebarPanel({ data, setData }: DividerSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const updateData = (d: unknown) => {
    const res = DividerPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const lineColor = data.props?.lineColor ?? DividerPropsDefaults.lineColor;
  const lineHeight = data.props?.lineHeight ?? DividerPropsDefaults.lineHeight;

  return (
    <BaseSidebarPanel title="Divider block">
      <ColorInput
        label="Color"
        defaultValue={lineColor}
        onChange={(lineColor) => updateData({ ...data, props: { ...data.props, lineColor } })}
      />
      <SliderInput
        label="Height"
        iconLabel={<MoveVertical className='h-4 w-4' />}
        units="px"
        step={1}
        min={1}
        max={24}
        defaultValue={lineHeight}
        onChange={(lineHeight) => updateData({ ...data, props: { ...data.props, lineHeight } })}
      />
      <MultiStylePropertyPanel
        names={['backgroundColor', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
