import React, { useState } from 'react';
import { SpacerProps, SpacerPropsDefaults, SpacerPropsSchema } from '../../../blocks/block-spacer';
import BaseSidebarPanel from './helpers/base-sidebar-panel';
import SliderInput from './helpers/inputs/slider-input';
import { MoveVertical } from 'lucide-react';

type SpacerSidebarPanelProps = {
  data: SpacerProps,
  setData: (v: SpacerProps) => void,
};
export default function SpacerSidebarPanel({ data, setData }: SpacerSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);

  const updateData = (d: unknown) => {
    const res = SpacerPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  return (
    <BaseSidebarPanel title="Spacer block">
      <SliderInput
        label="Height"
        iconLabel={<MoveVertical className='h-4 w-4' />}
        units="px"
        step={4}
        min={4}
        max={128}
        defaultValue={data.props?.height ?? SpacerPropsDefaults.height}
        onChange={(height) => updateData({ ...data, props: { ...data.props, height } })}
      />
    </BaseSidebarPanel>
  );
}
